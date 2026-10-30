'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const I18n = require('../js/i18n.js');
const { rules: TEMP_RULES, match: matchTemp } = require('../js/temp-rules.js');

// Normal desktop scans must not silently stop on large volumes. Callers may
// still provide an explicit limit when they deliberately need a safety guard.
const DEFAULT_MAX_ENTRIES = null;
const DEFAULT_MAX_DEPTH = 80;
const MB = 1024 * 1024;
const TREE_FILE_MIN_BYTES = 10 * MB;
const TREE_FOLDER_MIN_BYTES = 1 * MB;
const DUPLICATE_MIN_BYTES = 1 * MB;

function categoryOf(name) {
  const dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
  if (['mp4', 'mov', 'mkv', 'avi', 'm4v', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'aiff', 'wav', 'flac', 'm4a', 'aac', 'logicx'].includes(ext)) return 'audio';
  if (['png', 'jpg', 'jpeg', 'gif', 'heic', 'tiff', 'psd', 'ai', 'raw'].includes(ext)) return 'image';
  if (['zip', 'tar', 'gz', 'rar', '7z', 'tgz'].includes(ext)) return 'archive';
  if (['exe', 'msi', 'msix', 'appx', 'dmg', 'iso', 'pkg'].includes(ext)) return 'app';
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'numbers', 'pages', 'key', 'txt', 'md', 'csv', 'dwg'].includes(ext)) return 'doc';
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'html', 'css', 'json', 'java', 'c', 'cpp', 'cs', 'swift', 'go', 'rs', 'sh', 'ps1'].includes(ext)) return 'code';
  return 'other';
}

function scanPath(rootPath, options = {}) {
  const maxEntries = options.maxEntries == null ? DEFAULT_MAX_ENTRIES : options.maxEntries;
  const maxDepth = options.maxDepth == null ? DEFAULT_MAX_DEPTH : options.maxDepth;
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => {};
  const resolvedRoot = path.resolve(rootPath);
  // Fail a missing/unreadable root rather than presenting a successful 0-byte scan.
  if (!fs.statSync(resolvedRoot).isDirectory()) throw new Error(I18n.f('Lütfen bir klasör veya sürücü seçin.'));
  fs.readdirSync(resolvedRoot);
  const canonicalRoot = fs.realpathSync(resolvedRoot);
  function insideRoot(target) {
    const relative = path.relative(canonicalRoot, fs.realpathSync(target));
    return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
  }
  const rootName = path.basename(resolvedRoot) || resolvedRoot;
  let fileCount = 0;
  let folderCount = 1;
  let totalBytes = 0;
  let warnings = 0;
  let skippedLinks = 0;
  let truncated = false;
  let lastProgressAt = 0;
  const largeFiles = [];
  const duplicateCandidates = new Map();
  const categoryBytes = Object.create(null);
  const tempCategories = TEMP_RULES.map(rule => ({
    name: rule.name,
    icon: rule.icon,
    color: rule.color,
    risk: rule.risk,
    items: []
  }));

  function progress(currentPath, force = false) {
    const now = Date.now();
    if (!force && now - lastProgressAt < 120) return;
    lastProgressAt = now;
    onProgress({ files: fileCount, folders: folderCount, bytes: totalBytes, currentPath });
  }

  function makeFolder(folderPath, name, depth, includePath = false, inheritedTempRule = -1) {
    const node = {
      name,
      kind: 'folder',
      size: 0,
      files: 0,
      folders: 0,
      mod: null,
      children: []
    };
    // Child paths can be reconstructed from the root. Avoiding a full path on
    // every node keeps million-entry scan files at a manageable size.
    if (includePath) node.path = folderPath;
    const matchedTempRule = matchTemp(folderPath);
    const effectiveTempRule = inheritedTempRule >= 0 ? inheritedTempRule : matchedTempRule;
    const isTempRoot = inheritedTempRule < 0 && matchedTempRule >= 0;

    let entries;
    try {
      const stat = fs.lstatSync(folderPath);
      if ((!includePath && stat.isSymbolicLink()) || !insideRoot(folderPath)) {
        skippedLinks++; return node;
      }
      node.mod = stat.mtimeMs;
      entries = fs.readdirSync(folderPath, { withFileTypes: true });
    } catch (error) {
      node.access = 'Limited';
      node.error = error && error.code ? error.code : 'EACCESS';
      warnings++;
      return node;
    }

    if (depth >= maxDepth && entries.length) {
      node.access = 'Limited';
      node.error = 'MAX_DEPTH';
      warnings++;
      truncated = true;
      return node;
    }

    let omittedBytes = 0;
    let omittedFiles = 0;
    let omittedFolders = 0;

    for (const entry of entries) {
      if (maxEntries != null && fileCount + folderCount >= maxEntries) {
        truncated = true;
        warnings++;
        break;
      }

      const entryPath = path.join(folderPath, entry.name);
      try {
        if (entry.isSymbolicLink()) {
          skippedLinks++;
          continue;
        }
        const actual = fs.lstatSync(entryPath);
        if (actual.isSymbolicLink() || !insideRoot(entryPath)) { skippedLinks++; continue; }
        if (actual.isDirectory()) {
          folderCount++;
          const child = makeFolder(entryPath, entry.name, depth + 1, false, effectiveTempRule);
          node.size += child.size;
          node.files += child.files;
          node.folders += 1 + (child.folders || 0);
          if (child.size >= TREE_FOLDER_MIN_BYTES || child.access) {
            node.children.push(child);
          } else {
            omittedBytes += child.size;
            omittedFiles += child.files;
            omittedFolders += 1 + (child.folders || 0);
          }
        } else if (actual.isFile()) {
          const stat = actual;
          const size = Number(stat.size) || 0;
          const mod = stat.mtimeMs;
          const fileTempRule = effectiveTempRule < 0 ? matchTemp(entryPath, true) : -1;
          if (fileTempRule >= 0 && size > 0) {
            tempCategories[fileTempRule].items.push({ name: entry.name, path: entryPath, size });
          }
          const fileInfo = { name: entry.name, path: entryPath, size, mod };
          if (size >= TREE_FILE_MIN_BYTES) {
            node.children.push({ name: entry.name, kind: 'file', size, mod });
            largeFiles.push(fileInfo);
          } else {
            omittedBytes += size;
            omittedFiles++;
          }
          if (size >= DUPLICATE_MIN_BYTES) {
            const key = entry.name.toLowerCase() + '|' + size;
            let group = duplicateCandidates.get(key);
            if (!group) {
              group = { name: entry.name, size, kind: 'other', copies: [] };
              duplicateCandidates.set(key, group);
            }
            group.copies.push({ path: entryPath, mod });
          }
          const category = categoryOf(entry.name);
          categoryBytes[category] = (categoryBytes[category] || 0) + size;
          fileCount++;
          totalBytes += size;
          node.size += size;
          node.files++;
        }
      } catch (error) {
        warnings++;
      }
      progress(entryPath);
    }

    if (isTempRoot && node.size > 0) {
      tempCategories[matchedTempRule].items.push({ name, path: folderPath, size: node.size });
    }

    if (omittedFiles || omittedFolders) {
      node.children.push({
        name: I18n.f('Diğer küçük öğeler'),
        kind: 'aggregate',
        size: omittedBytes,
        files: omittedFiles,
        folders: omittedFolders,
        virtual: true
      });
    }

    node.children.sort((a, b) => b.size - a.size || a.name.localeCompare(b.name, 'tr'));
    return node;
  }

  const root = makeFolder(resolvedRoot, rootName, 0, true);
  progress(resolvedRoot, true);

  largeFiles.sort((a, b) => b.size - a.size);
  const duplicateGroups = Array.from(duplicateCandidates.values())
    .filter(group => group.copies.length > 1)
    .sort((a, b) => (b.copies.length - 1) * b.size - (a.copies.length - 1) * a.size);
  duplicateCandidates.clear();

  let volume = null;
  try {
    const statfs = fs.statfsSync(resolvedRoot);
    const blockSize = Number(statfs.bsize || statfs.frsize || 0);
    volume = {
      total: blockSize * Number(statfs.blocks || 0),
      free: blockSize * Number(statfs.bavail || statfs.bfree || 0)
    };
  } catch (_) {
    // Bazı ağ sürücüleri disk kapasitesini bildirmez; tarama yine de geçerlidir.
  }

  return {
    schemaVersion: 5,
    scanId: randomUUID(),
    source: 'desktop',
    scannedAt: Date.now(),
    scanRoot: resolvedRoot,
    warnings,
    skippedLinks,
    truncated,
    limits: { maxEntries, maxDepth },
    storage: {
      treeFileMinBytes: TREE_FILE_MIN_BYTES,
      treeFolderMinBytes: TREE_FOLDER_MIN_BYTES,
      fullFileCount: fileCount,
      fullFolderCount: folderCount - 1
    },
    largeFiles,
    duplicateGroups,
    tempCategories: tempCategories.filter(category => category.items.length),
    categoryBytes,
    volume,
    root
  };
}

module.exports = { scanPath, DEFAULT_MAX_ENTRIES, DEFAULT_MAX_DEPTH };
