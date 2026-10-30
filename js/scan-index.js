(function (root) {
  'use strict';
  const temp = typeof module !== 'undefined' && module.exports ? require('./temp-rules.js') : root.RadixTempRules;
  function categoryOf(name) {
    const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '';
    const types = {
      video: ['mp4','mov','mkv','avi','m4v','webm'], audio: ['mp3','aiff','wav','flac','m4a','aac','logicx'],
      image: ['png','jpg','jpeg','gif','heic','tiff','psd','ai','raw'], archive: ['zip','tar','gz','rar','7z','tgz'],
      app: ['exe','msi','msix','appx','dmg','iso','pkg'], doc: ['pdf','doc','docx','xls','xlsx','numbers','pages','key','txt','md','csv','dwg'],
      code: ['js','ts','tsx','jsx','py','html','css','json','java','c','cpp','cs','swift','go','rs','sh','ps1']
    };
    for (const [type, extensions] of Object.entries(types)) if (extensions.includes(ext)) return type;
    return 'other';
  }
  function indexTree(rootNode) {
    const largeFiles = [], candidates = new Map(), categoryBytes = Object.create(null);
    const tempCategories = temp.rules.map(({ name, icon, color, risk }) => ({ name, icon, color, risk, items: [] }));
    const stack = [{ node: rootNode, path: rootNode.path || '/' + rootNode.name, inherited: -1 }];
    while (stack.length) {
      const { node, path, inherited } = stack.pop();
      if (node.kind === 'folder') {
        const matched = inherited >= 0 ? inherited : temp.match(path);
        if (inherited < 0 && matched >= 0 && node.size > 0) tempCategories[matched].items.push({ name: node.name, path, size: node.size });
        for (const child of node.children || []) stack.push({ node: child, path: child.path || path.replace(/\/$/, '') + '/' + child.name, inherited: matched });
      } else if (node.kind === 'file') {
        const item = { name: node.name, path, size: node.size, mod: node.mod };
        if (node.size >= 10 * 1024 * 1024) largeFiles.push(item);
        if (node.size >= 1024 * 1024) {
          const key = node.name.toLowerCase() + '|' + node.size;
          if (!candidates.has(key)) candidates.set(key, { name: node.name, size: node.size, kind: 'other', copies: [] });
          candidates.get(key).copies.push({ path, mod: node.mod });
        }
        const category = categoryOf(node.name); categoryBytes[category] = (categoryBytes[category] || 0) + node.size;
        const rule = inherited < 0 ? temp.match(path, true) : -1;
        if (rule >= 0 && node.size > 0) tempCategories[rule].items.push(item);
      }
    }
    return { largeFiles: largeFiles.sort((a,b)=>b.size-a.size), duplicateGroups: [...candidates.values()].filter(group=>group.copies.length>1).sort((a,b)=>(b.copies.length-1)*b.size-(a.copies.length-1)*a.size), categoryBytes, tempCategories: tempCategories.filter(category=>category.items.length) };
  }
  const api = { categoryOf, indexTree };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ScanIndex = api;
})(typeof window !== 'undefined' ? window : globalThis);
