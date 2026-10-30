/* TaxDisc — gerçek klasör taraması (File System Access API) */
(function () {
  const MAX_FILES = 80000;
  const MAX_DEPTH = 10;

  async function scan(onProgress) {
    if (!window.showDirectoryPicker) throw new Error(I18n.f('Tarayıcı desteklemiyor'));
    const dir = await window.showDirectoryPicker({ mode: 'read' });
    let files = 0, errors = 0, truncated = false;

    async function walk(dirHandle, name, depth) {
      const node = { name, kind: 'folder', mod: null, access: null, children: [] };
      try {
        for await (const entry of dirHandle.values()) {
          if (files >= MAX_FILES) { truncated = true; break; }
          try {
            if (entry.kind === 'file') {
              const f = await entry.getFile();
              node.children.push({ name: entry.name, kind: 'file', size: f.size, mod: f.lastModified, access: null, children: null });
              files++;
              if (files % 400 === 0 && onProgress) onProgress(files, entry.name);
            } else if (depth < MAX_DEPTH) {
              node.children.push(await walk(entry, entry.name, depth + 1));
            } else {
              errors++;
              truncated = true;
            }
          } catch (e) { errors++; }
        }
      } catch (e) { errors++; }
      let size = 0, cnt = 0, folders = 0;
      for (const c of node.children) { size += c.size; cnt += c.kind === 'folder' ? (c.files || 0) : 1; if (c.kind === 'folder') folders += 1 + (c.folders || 0); }
      node.size = size;
      node.files = cnt;
      node.folders = folders;
      if (!node.children.length) node.children = null;
      return node;
    }

    const root = await walk(dir, dir.name, 0);
    root.path = '/' + dir.name;
    return {
      source: 'scan',
      scannedAt: Date.now(),
      warnings: errors + (truncated ? 1 : 0),
      truncated,
      root,
      ...ScanIndex.indexTree(root)
    };
  }

  window.Scanner = { scan };
})();
