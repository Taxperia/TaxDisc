/* TaxDisc — SVG ikon kütüphanesi (SF Symbols tarzı çizgi ikonlar) */
(function () {
  const I = {
    disk: '<ellipse cx="12" cy="6" rx="7.2" ry="2.7"/><path d="M4.8 6v12c0 1.5 3.2 2.7 7.2 2.7s7.2-1.2 7.2-2.7V6"/><path d="M4.8 12c0 1.5 3.2 2.7 7.2 2.7s7.2-1.2 7.2-2.7"/>',
    home: '<path d="M3.8 10.4 12 3.6l8.2 6.8"/><path d="M5.7 9.2V20h12.6V9.2"/><path d="M10 20v-5.2h4V20"/>',
    desktop: '<rect x="3" y="4.4" width="18" height="12.2" rx="2"/><path d="M9 20.4h6"/><path d="M12 16.6v3.8"/>',
    documents: '<path d="M8 3.4h6.4L19 7.9v12.7H8z"/><path d="M14.2 3.6v4.5H19"/><path d="M10.6 12.4h5.4M10.6 15.6h5.4"/>',
    downloads: '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.6v7"/><path d="m8.9 11.7 3.1 3.1 3.1-3.1"/>',
    library: '<path d="M3.4 20.4h17.2"/><path d="M5.4 20V10.2M10 20V4.6M14.6 20v-7.6M19 20V7.4"/>',
    apps: '<rect x="4" y="4" width="6.6" height="6.6" rx="1.6"/><rect x="13.4" y="4" width="6.6" height="6.6" rx="1.6"/><rect x="4" y="13.4" width="6.6" height="6.6" rx="1.6"/><rect x="13.4" y="13.4" width="6.6" height="6.6" rx="1.6"/>',
    folder: '<path d="M3.6 7.4c0-1.1.9-2 2-2h3.8l2 2h7c1.1 0 2 .9 2 2v8.2c0 1.1-.9 2-2 2H5.6c-1.1 0-2-.9-2-2z"/>',
    folderFill: '<path fill="currentColor" stroke="none" d="M3.2 7.2c0-1.1.9-2 2-2h4.1l2 2h7.5c1.1 0 2 .9 2 2v7.8c0 1.2-1 2.2-2.2 2.2H5.4c-1.2 0-2.2-1-2.2-2.2z"/>',
    folderPlus: '<path d="M3.6 7.4c0-1.1.9-2 2-2h3.8l2 2h7c1.1 0 2 .9 2 2v8.2c0 1.1-.9 2-2 2H5.6c-1.1 0-2-.9-2-2z"/><path d="M12 11v5.2M9.4 13.6h5.2"/>',
    doc: '<path d="M8 3.4h6.4L19 7.9v12.7H8z"/><path d="M14.2 3.6v4.5H19"/>',
    image: '<rect x="3.4" y="4.8" width="17.2" height="14.4" rx="2"/><circle cx="8.6" cy="9.6" r="1.7"/><path d="m4.4 17.6 4.7-4.7 3.6 3.6 3-3 4 4"/>',
    video: '<rect x="3" y="5.8" width="13.4" height="12.4" rx="2.4"/><path d="m16.4 10.4 4.6-2.8v8.8l-4.6-2.8"/>',
    audio: '<path d="M9.2 18.4V6.6l9-1.9v11.2"/><circle cx="6.9" cy="18.4" r="2.3"/><circle cx="15.9" cy="15.9" r="2.3"/>',
    archive: '<rect x="3.4" y="4.6" width="17.2" height="4.6" rx="1.1"/><path d="M5.5 9.2V19c0 .8.7 1.5 1.5 1.5h10c.8 0 1.5-.7 1.5-1.5V9.2"/><path d="M10 13h4"/>',
    disc: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.6"/>',
    code: '<path d="m9 8.4-4 3.6 4 3.6"/><path d="m15 8.4 4 3.6-4 3.6"/>',
    warning: '<path d="M10.9 4.5 3.3 18.2c-.6 1 .2 2.3 1.3 2.3h15c1.1 0 1.9-1.3 1.3-2.3L13.3 4.5c-.6-1-1.9-1-2.4 0z"/><path d="M12 9.4v4.4"/><path d="M12 16.9h.01"/>',
    search: '<circle cx="11" cy="11" r="6.6"/><path d="m16.2 16.2 4.4 4.4"/>',
    chevL: '<path d="M14.5 6 8.5 12l6 6"/>',
    chevR: '<path d="m9.5 6 6 6-6 6"/>',
    chevD: '<path d="m6 9.5 6 6 6-6"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20.2 4.4v4.7h-4.7"/>',
    columns: '<rect x="3.4" y="4.4" width="17.2" height="15.2" rx="2"/><path d="M14.6 4.6v14.8"/>',
    sidebar: '<rect x="3.4" y="4.4" width="17.2" height="15.2" rx="2"/><path d="M9.4 4.6v14.8"/>',
    pie: '<circle cx="12" cy="12" r="8.4"/><path d="M12 3.6V12l6 6"/>',
    tableGrid: '<rect x="3.4" y="4.4" width="17.2" height="15.2" rx="2"/><path d="M3.4 9.8h17.2M9.8 9.8v9.6M15.4 9.8v9.6"/>',
    eye: '<path d="M2.6 12S6 5.6 12 5.6 21.4 12 21.4 12 18 18.4 12 18.4 2.6 12 2.6 12z"/><circle cx="12" cy="12" r="2.8"/>',
    reveal: '<path d="M3.6 7.4c0-1.1.9-2 2-2h3.8l2 2h7c1.1 0 2 .9 2 2v8.2c0 1.1-.9 2-2 2H5.6c-1.1 0-2-.9-2-2z"/><circle cx="11" cy="12.4" r="2.5"/><path d="m12.9 14.3 2.1 2.1"/>',
    zoomIn: '<circle cx="10.8" cy="10.8" r="6.4"/><path d="m15.6 15.6 4.4 4.4"/><path d="M10.8 8v5.6M8 10.8h5.6"/>',
    open: '<path d="M12 14.2V4.4"/><path d="M8.6 7.8 12 4.4l3.4 3.4"/><path d="M5 12.4v6c0 .9.7 1.6 1.6 1.6h10.8c.9 0 1.6-.7 1.6-1.6v-6"/>',
    copy: '<rect x="8.6" y="8.6" width="11" height="11" rx="2"/><path d="M15.4 5.6v-1c0-1-.8-1.8-1.8-1.8H5.4c-1 0-1.8.8-1.8 1.8v8.2c0 1 .8 1.8 1.8 1.8h1"/>',
    sliders: '<path d="M5 7h14M5 12h14M5 17h14"/><circle cx="9.4" cy="7" r="1.8" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="8" cy="17" r="1.8" fill="currentColor" stroke="none"/>',
    trash: '<path d="M4.6 6.6h14.8"/><path d="M8.6 6.4V5c0-.8.6-1.4 1.4-1.4h4c.8 0 1.4.6 1.4 1.4v1.4"/><path d="m6.4 6.8.7 12.8c0 .8.7 1.5 1.5 1.5h6.8c.8 0 1.5-.7 1.5-1.5l.7-12.8"/><path d="M10 10.6v6M14 10.6v6"/>',
    check: '<path d="m5 12.6 4.6 4.6L19 7.4"/>',
    xmark: '<path d="m6 6 12 12M18 6 6 18"/>',
    broom: '<path d="M14.2 3.8 20 9.6"/><path d="M9.8 8.2 15.6 14c-1.8 3.4-4.9 5.4-9.4 6.2-.9-4.5.6-8.4 3.6-12z"/><path d="M9.8 8.2 6.4 11.6"/>',
    clock: '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.4V12l3.1 1.9"/>',
    timer: '<circle cx="12" cy="13.4" r="7.4"/><path d="M12 9.8v3.6l2.6 1.6"/><path d="M9.6 2.8h4.8"/><path d="M12 2.8v3.2"/>',
    mapIcon: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M10.4 4v16M10.4 12H20M10.4 7.4H20M10.4 16.4H20"/>',
    bigFile: '<path d="M8 3.4h6.4L19 7.9v12.7H8z"/><path d="M14.2 3.6v4.5H19"/><path d="M12 17.4v-5.2M9.8 14.3 12 12.1l2.2 2.2"/>',
    duplicates: '<rect x="8.6" y="8.6" width="11" height="11" rx="2"/><path d="M15.4 5.4H5.6c-1 0-1.8.8-1.8 1.8v9.8"/>',
    chartLine: '<path d="M3.4 20.6h17.2"/><path d="m4.6 16.4 4.4-5.6 3.6 3 4.8-6.6"/><path d="M17.4 7.2h2.6v2.6"/>',
    export: '<path d="M12 14.6V4.4"/><path d="M8.6 7.8 12 4.4l3.4 3.4"/><rect x="4" y="12.6" width="16" height="7.8" rx="1.6"/>',
    printer: '<path d="M7 8.2V4h10v4.2"/><rect x="4" y="8.2" width="16" height="8" rx="1.8"/><path d="M7 13.6h10V20H7z"/>',
    broomSm: '<path d="M14.2 3.8 20 9.6"/><path d="M9.8 8.2 15.6 14c-1.8 3.4-4.9 5.4-9.4 6.2-.9-4.5.6-8.4 3.6-12z"/>',
    spark: '<path d="M12 3.4 13.8 9l5.6 1.8-5.6 1.8L12 18.2l-1.8-5.6-5.6-1.8L10.2 9z"/>',
    info: '<circle cx="12" cy="12" r="8.4"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    lock: '<rect x="5.4" y="10.6" width="13.2" height="9.4" rx="2"/><path d="M8.4 10.6V7.8a3.6 3.6 0 0 1 7.2 0v2.8"/>',
    circleDashed: '<circle cx="12" cy="12" r="8.4" stroke-dasharray="3.4 3.2"/>'
  };

  window.ic = function (name, cls) {
    const p = I[name] || I.doc;
    return '<span class="ico' + (cls ? ' ' + cls : '') + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg></span>';
  };
  window.ICONS = I;
})();
