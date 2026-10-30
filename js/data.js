/* TaxDisc — Demo veri kümesi ve yardımcı veri üreticileri */
(function () {
  const MB = 1048576, GB = 1073741824;

  function ts(s) { return new Date(s).getTime(); }

  function file(name, size, mod, access) {
    return { name, size, kind: 'file', mod: ts(mod), access: access || null, children: null };
  }
  function leafFolder(name, size, mod, access) {
    return { name, size, kind: 'folder', mod: ts(mod), access: access || null, children: null };
  }
  // files: görüntülenen dosya sayısını elle sabitlemek için
  function folder(name, children, opts) {
    opts = opts || {};
    let size = 0, files = 0;
    for (const c of children) { size += c.size; files += c.kind === 'folder' ? (c.files || 0) : 1; }
    return { name, size, files: opts.files != null ? opts.files : files, kind: 'folder', mod: opts.mod ? ts(opts.mod) : null, access: opts.access || null, children };
  }

  /* ---- Library (resimdeki yapıya birebir yakın) ---- */
  function buildLibrary() {
    const developer = folder('Developer', [
      folder('CommandLineTools', [
        folder('usr', [
          folder('lib', [
            folder('swift', [leafFolder('host', 88.4 * MB, '2026-06-27T14:02'), leafFolder('modules', 8.4 * MB, '2026-06-27T14:02')], { files: 42, mod: '2026-06-27T14:02' }),
            file('libclang.dylib', 122.5 * MB, '2026-06-27T14:02'),
            folder('sourcekitdIn.framework', [file('sourcekitdIn', 58.2 * MB, '2026-06-12T09:44'), file('Info.plist', 0.02 * MB, '2026-06-12T09:44')], { files: 6, mod: '2026-06-12T09:44' }),
            folder('Versions', [leafFolder('Current', 12.1 * MB, '2026-05-30T11:20')], { files: 4, mod: '2026-05-30T11:20' }),
            file('libLTO.dylib', 18.6 * MB, '2026-06-27T14:02'),
            leafFolder('clang_rt', 106.4 * MB, '2026-06-27T14:02')
          ], { files: 132, mod: '2026-06-27T14:02' }),
          folder('bin', [
            file('swift-frontend', 142.8 * MB, '2026-06-27T14:02'),
            file('clang', 120.2 * MB, '2026-06-27T14:02'),
            file('clang++', 96.4 * MB, '2026-06-27T14:02'),
            file('lldb-argdumper', 12.4 * MB, '2026-06-27T14:02'),
            leafFolder('tools', 14.4 * MB, '2026-06-27T14:02')
          ], { files: 88, mod: '2026-06-27T14:02' }),
          folder('share', [leafFolder('man', 48.2 * MB, '2026-05-30T11:20'), leafFolder('doc', 84.2 * MB, '2026-05-30T11:20')], { files: 310, mod: '2026-05-30T11:20' }),
          leafFolder('include', 96.8 * MB, '2026-05-30T11:20'),
          leafFolder('libexec', 64.2 * MB, '2026-05-30T11:20')
        ], { files: 548, mod: '2026-06-27T14:02' }),
        folder('Library', [
          leafFolder('PrivateFrameworks', 118.6 * MB, '2026-06-12T09:44'),
          folder('LLDB.framework', [file('LLDB', 66.4 * MB, '2026-06-12T09:44'), leafFolder('Resources', 4.9 * MB, '2026-06-12T09:44')], { files: 12, mod: '2026-06-12T09:44' }),
          leafFolder('PlugIns', 26.5 * MB, '2026-06-12T09:44')
        ], { files: 38, mod: '2026-06-12T09:44' })
      ], { files: 590, mod: '2026-06-27T14:02' }),
      folder('SDKs', [
        folder('MacOSX26.5.sdk', [
          folder('usr', [leafFolder('share', 96.2 * MB, '2026-07-01T10:00'), leafFolder('lib', 72.2 * MB, '2026-07-01T10:00')], { files: 210, mod: '2026-07-01T10:00' }),
          folder('System', [leafFolder('Library', 179.8 * MB, '2026-07-01T10:00')], { files: 96, mod: '2026-07-01T10:00' })
        ], { files: 310, mod: '2026-07-01T10:00' }),
        folder('MacOSX15.4.sdk', [
          folder('usr', [leafFolder('share', 82.4 * MB, '2026-03-18T16:40'), leafFolder('lib', 59.8 * MB, '2026-03-18T16:40')], { files: 180, mod: '2026-03-18T16:40' }),
          folder('System', [leafFolder('Library', 152.4 * MB, '2026-03-18T16:40')], { files: 88, mod: '2026-03-18T16:40' })
        ], { files: 272, mod: '2026-03-18T16:40' })
      ], { files: 582, mod: '2026-07-01T10:00' }),
      leafFolder('Platforms', 118.6 * MB, '2026-07-01T10:00'),
      leafFolder('DeveloperDiskImages', 184.2 * MB, '2026-06-20T18:12'),
      leafFolder('CoreDevice', 66.9 * MB, '2026-06-20T18:12')
    ], { files: 69467, mod: '2026-06-27T16:22' });

    const appSupport = folder('Application Support', [
      folder('Blackmagic Design', [
        folder('DaVinci Resolve', [
          folder('Prereqs', [
            file('davinci_panels.tgz', 578.1 * MB, '2026-07-09T12:20'),
            file('panel_firmware.bin', 26.1 * MB, '2026-07-09T12:20')
          ], { files: 4, mod: '2026-07-09T12:20' }),
          leafFolder('FX Templates', 182.4 * MB, '2026-07-09T12:20'),
          leafFolder('Fairlight Audio', 148.6 * MB, '2026-07-09T12:20'),
          leafFolder('LUTs', 92.3 * MB, '2026-07-09T12:20'),
          leafFolder('Fusion Templates', 24.2 * MB, '2026-07-09T12:20'),
          leafFolder('Support', 8.3 * MB, '2026-07-09T12:20')
        ], { files: 2860, mod: '2026-07-09T12:38' }),
        leafFolder('Resolve Projects', 118.2 * MB, '2026-07-02T21:05')
      ], { files: 2874, mod: '2026-07-09T12:38' }),
      folder('Logic', [
        folder('EXS Factory Samples', [
          leafFolder('Stereo', 306.0 * MB, '2026-06-15T09:30'),
          leafFolder('Drum Kit Designer', 96.2 * MB, '2026-06-15T09:30'),
          leafFolder('Drum Kit Diverse', 88.4 * MB, '2026-06-15T09:30'),
          leafFolder('01 Acoustic Pianos', 12.4 * MB, '2026-06-15T09:30'),
          leafFolder('Steinway Models', 6.2 * MB, '2026-06-15T09:30'),
          leafFolder('07 Guitars', 2.1 * MB, '2026-06-15T09:30'),
          leafFolder('Ultrabeat Kits', 1.1 * MB, '2026-06-15T09:30')
        ], { files: 1214, mod: '2026-06-15T09:30' }),
        folder('Alchemy Samples', [
          leafFolder('Bass', 62.4 * MB, '2026-06-15T09:30'),
          leafFolder('Pads', 58.1 * MB, '2026-06-15T09:30'),
          leafFolder('Pianos', 49.2 * MB, '2026-06-15T09:30'),
          leafFolder('Leads', 44.9 * MB, '2026-06-15T09:30')
        ], { files: 402, mod: '2026-06-15T09:30' }),
        leafFolder('Ultrabeat Samples', 96.8 * MB, '2026-06-15T09:30'),
        leafFolder('07 Guitar Rigs', 71.4 * MB, '2026-06-15T09:30'),
        leafFolder('Steinway Library', 43.6 * MB, '2026-06-15T09:30')
      ], { files: 1654, mod: '2026-06-15T09:30' }),
      folder('Microsoft', [leafFolder('Teams', 8.2 * MB, '2026-06-28T08:14'), leafFolder('AutoUpdate', 3.6 * MB, '2026-06-28T08:14')], { files: 26, mod: '2026-06-28T08:14' }),
      folder('Apple', [leafFolder('iCloud', 3.4 * MB, '2026-06-30T03:07'), leafFolder('Feedback', 2.6 * MB, '2026-06-30T03:07')], { files: 18, mod: '2026-06-30T03:07' }),
      leafFolder('GarageBand', 2.1 * MB, '2026-04-11T19:47'),
      leafFolder('mobilemeaccounts', 0.4 * MB, '2026-04-11T19:47')
    ], { files: 4867, mod: '2026-07-09T12:38' });

    const audio = folder('Audio', [
      folder('Plug-Ins', [leafFolder('Apple', 118.4 * MB, '2026-06-30T03:07'), leafFolder('AAX', 58.2 * MB, '2026-06-30T03:07'), leafFolder('VST', 37.6 * MB, '2026-06-30T03:07')], { files: 642, mod: '2026-06-30T03:07' }),
      folder('Drivers', [leafFolder('CoreAudio', 96.4 * MB, '2026-06-30T03:07'), leafFolder('HAL', 32.4 * MB, '2026-06-30T03:07')], { files: 388, mod: '2026-06-30T03:07' }),
      leafFolder('Sounds', 118.4 * MB, '2026-06-30T03:07'),
      leafFolder('Apple Loops', 102.6 * MB, '2026-06-30T03:07'),
      leafFolder('MIDI Drivers', 27.9 * MB, '2026-06-30T03:07')
    ], { files: 1835, mod: '2026-06-30T03:07' });

    const fonts = folder('Fonts', [
      leafFolder('Apple', 182.4 * MB, '2026-06-30T03:07'),
      leafFolder('Supplemental', 96.2 * MB, '2026-06-30T03:07'),
      leafFolder('System', 88.6 * MB, '2026-06-30T03:07'),
      leafFolder('Additional', 70.9 * MB, '2026-06-30T03:07')
    ], { files: 85, mod: '2026-06-30T03:07' });

    const apple = folder('Apple', [
      leafFolder('Certificates', 28.4 * MB, '2026-06-30T03:07'),
      leafFolder('MobileAsset', 24.6 * MB, '2026-06-30T03:07'),
      leafFolder('Firmware', 18.9 * MB, '2026-06-30T03:07')
    ], { files: 1135, mod: '2026-06-30T03:07' });

    const sysExt = folder('SystemExtensions', [
      leafFolder('FilesystemEx', 24.2 * MB, '2026-07-14T10:26'),
      leafFolder('NetworkEx', 18.4 * MB, '2026-07-14T10:26'),
      leafFolder('AudioEx', 10.5 * MB, '2026-07-14T10:26')
    ], { files: 9, mod: '2026-07-14T10:26' });

    const trial = folder('Trial', [
      leafFolder('TrialApps', 24.6 * MB, '2026-03-12T18:20'),
      leafFolder('Cache', 14.9 * MB, '2026-03-12T18:20')
    ], { files: 71, mod: '2026-03-12T18:20', access: 'Limited' });

    const images = folder('Images', [
      leafFolder('Screenshots', 18.4 * MB, '2026-06-24T10:38'),
      leafFolder('Icons', 8.9 * MB, '2026-06-24T10:38')
    ], { files: 268, mod: '2026-06-24T10:38' });

    return folder('Library', [
      developer, appSupport, audio, fonts, apple, sysExt, trial, images,
      leafFolder('Preferences', 8.4 * MB, '2026-07-13T22:04'),
      folder('Logs', [file('system.log', 1.2 * MB, '2026-07-14T09:58'), leafFolder('wifi', 0.9 * MB, '2026-07-14T09:58'), leafFolder('diagnostics', 1.0 * MB, '2026-07-14T09:58')], { files: 156, mod: '2026-07-14T09:58' }),
      leafFolder('Cookies', 1.9 * MB, '2026-07-13T22:04'),
      leafFolder('Keychains', 0.4 * MB, '2026-07-02T21:05'),
      leafFolder('StartupItems', 0.1 * MB, '2026-02-02T08:00')
    ], { files: 78335, mod: '2026-07-14T12:12' });
  }

  /* ---- Kullanıcı klasörleri (büyük dosyalar / yinelenenler için) ---- */
  function buildUsers() {
    const colin = folder('colin', [
      folder('Desktop', [
        file('ekran_kaydi_2026-08-14.mov', 1.42 * GB, '2026-08-14T17:22'),
        file('sunum_tasarim_final.psd', 684.2 * MB, '2026-08-11T10:04'),
        file('logo_taslak.png', 1.2 * MB, '2026-08-02T15:40'),
        file('masa_yedegi.zip', 412.4 * MB, '2026-07-30T23:10'),
        leafFolder('Ekran Görüntüleri', 86.2 * MB, '2026-08-14T09:12'),
        file('okul_projesi.docx', 4.8 * MB, '2026-07-21T13:35'),
        leafFolder('Eski Masaüstü', 1.54 * GB, '2026-05-02T11:00')
      ], { files: 1240, mod: '2026-08-14T17:22' }),
      folder('Documents', [
        file('finans_model_2026.numbers', 84.2 * MB, '2026-08-09T14:41'),
        file('mimari_cizimler.dwg', 62.4 * MB, '2026-07-19T09:02'),
        folder('Raporlar', [
          file('rapor_Q2_final_FINAL.pdf', 18.4 * MB, '2026-07-02T16:18'),
          file('rapor_Q2_final.pdf', 18.4 * MB, '2026-07-01T11:02'),
          file('butce_ozet.xlsx', 3.2 * MB, '2026-06-28T10:00')
        ], { files: 14, mod: '2026-07-02T16:18' }),
        leafFolder('Sözleşmeler', 3.2 * MB, '2026-06-10T12:00'),
        leafFolder('Eski Belgeler', 12.8 * GB, '2026-04-01T09:00'),
        leafFolder('Araştırma', 5.6 * GB, '2026-07-25T18:30')
      ], { files: 3820, mod: '2026-08-09T14:41' }),
      folder('Downloads', [
        file('Xcode_26.5_beta.dmg', 6.84 * GB, '2026-08-06T22:31'),
        file('ubuntu-26.04-desktop.iso', 5.2 * GB, '2026-07-17T13:09'),
        file('AdobeCC_2026_Installer.dmg', 3.18 * GB, '2026-08-01T19:55'),
        file('ps_kutuphane_v9.zip', 1.06 * GB, '2026-07-28T08:47'),
        file('dataset_arac_fiyat.tar.gz', 812.4 * MB, '2026-07-05T14:22'),
        folder('Eski', [
          file('Xcode_26.4.dmg', 6.6 * GB, '2026-05-14T10:00'),
          file('eski_yedek.zip', 18.2 * GB, '2026-04-22T23:41'),
          file('adobe_cc_2024.dmg', 3.02 * GB, '2026-03-09T12:12'),
          leafFolder('karisik', 14.28 * GB, '2026-02-15T09:00')
        ], { files: 412, mod: '2026-05-14T10:00' }),
        leafFolder('Tora indirilenler', 24.1 * GB, '2026-08-12T20:00')
      ], { files: 894, mod: '2026-08-14T08:12' }),
      folder('Movies', [
        file('kurg_final_v3.mov', 3.42 * GB, '2026-08-13T23:48'),
        file('drone_manzara_4k.mov', 1.87 * GB, '2026-07-22T18:05'),
        file('dugun_export_h264.mp4', 1.24 * GB, '2026-07-11T21:37'),
        file('OBS_Kayit_2026-05-12.mkv', 986.4 * MB, '2026-05-12T20:15'),
        leafFolder('Projeler', 132.4 * GB, '2026-08-13T23:00'),
        leafFolder('Arşiv', 8.6 * GB, '2026-06-02T11:30')
      ], { files: 318, mod: '2026-08-13T23:48' }),
      folder('Music', [
        folder('Logic', [
          file('Proje_Karisim_v4.logicx', 1.18 * GB, '2026-08-08T02:14'),
          leafFolder('Samples', 12.4 * GB, '2026-08-08T02:14'),
          leafFolder('Bounce Dosyaları', 5.02 * GB, '2026-08-01T01:00')
        ], { files: 1240, mod: '2026-08-08T02:14' }),
        leafFolder('Apple Music', 14.2 * GB, '2026-07-30T09:00'),
        leafFolder('GarageBand', 9.0 * GB, '2026-06-18T22:10')
      ], { files: 6120, mod: '2026-08-08T02:14' }),
      folder('Pictures', [
        folder('Photos Library', [leafFolder('originals', 18.2 * GB, '2026-08-10T12:00'), leafFolder('thumbnails', 6.0 * GB, '2026-08-10T12:00')], { files: 24800, mod: '2026-08-10T12:00' }),
        leafFolder('RAW Arşiv', 4.2 * GB, '2026-07-08T19:20')
      ], { files: 25140, mod: '2026-08-10T12:00' }),
      leafFolder('Public', 0.2 * GB, '2026-01-05T10:00')
    ], { files: 81400, mod: '2026-08-14T17:22' });

    return folder('Users', [colin, leafFolder('Shared', 0.2 * GB, '2026-01-05T10:00')], { files: 81500, mod: '2026-08-14T17:22' });
  }

  function buildApplications() {
    return folder('Applications', [
      leafFolder('Adobe Creative Cloud', 12.4 * GB, '2026-08-01T19:55'),
      leafFolder('DaVinci Resolve', 8.2 * GB, '2026-07-09T12:38'),
      leafFolder('Xcode', 7.9 * GB, '2026-08-06T22:31'),
      leafFolder('Microsoft Office', 4.6 * GB, '2026-06-28T08:14'),
      leafFolder('Logic Pro', 3.2 * GB, '2026-06-15T09:30'),
      leafFolder('Final Cut Pro', 3.1 * GB, '2026-06-02T11:30'),
      leafFolder('Utilities', 2.8 * GB, '2026-07-14T10:26'),
      leafFolder('Diğer', 4.0 * GB, '2026-07-01T10:00')
    ], { files: 640, mod: '2026-08-06T22:31' });
  }

  function buildSystem() {
    return folder('System', [
      leafFolder('Library', 12.4 * GB, '2026-07-14T10:26'),
      leafFolder('CoreServices', 4.2 * GB, '2026-07-14T10:26'),
      leafFolder('Extensions', 2.3 * GB, '2026-07-14T10:26')
    ], { files: 182000, mod: '2026-07-14T10:26' });
  }

  function buildPrivate() {
    return folder('private', [
      folder('var', [leafFolder('folders', 2.8 * GB, '2026-08-14T09:58'), leafFolder('db', 1.3 * GB, '2026-08-14T09:58')], { files: 9400, mod: '2026-08-14T09:58' }),
      leafFolder('etc', 2.3 * GB, '2026-07-14T10:26')
    ], { files: 9600, mod: '2026-08-14T09:58' });
  }

  function demoDataset() {
    const root = folder('Macintosh HD', [
      buildLibrary(), buildUsers(), buildApplications(), buildSystem(), buildPrivate()
    ], { files: 352000, mod: '2026-08-14T17:22' });
    assignIds(root);
    return {
      source: 'demo',
      scannedAt: ts('2026-08-14T17:22'),
      warnings: 270,
      root
    };
  }

  function emptyDataset() {
    const root = {
      name: 'Henüz tarama yapılmadı', path: null, size: 0, files: 0, folders: 0,
      kind: 'folder', mod: null, access: null, children: []
    };
    assignIds(root);
    return { schemaVersion: 5, source: 'empty', scannedAt: null, warnings: 0, root };
  }

  function assignIds(root) {
    let i = 0;
    const stack = [{ node: root, parent: null }];
    while (stack.length) {
      const { node, parent } = stack.pop();
      node.id = 'n' + (i++);
      Object.defineProperty(node, 'parent', {
        value: parent, writable: true, configurable: true, enumerable: false
      });
      if (node.children) {
        for (let x = node.children.length - 1; x >= 0; x--) {
          stack.push({ node: node.children[x], parent: node });
        }
      }
    }
  }

  /* ---- Demo: büyük dosya eşiği/kategori yardımcıları data.js'te değil, sayfa JS'lerinde ---- */

  /* ---- Demo: yinelenen dosya grupları ---- */
  const DEMO_DUPES = [
    { name: 'Xcode_26.5_beta.dmg', size: 6.84 * GB, kind: 'app',
      copies: [
        { path: '/Users/colin/Downloads/Xcode_26.5_beta.dmg', mod: '2026-08-06T22:31' },
        { path: '/Users/colin/Downloads/Eski/Xcode_26.5_beta.dmg', mod: '2026-08-05T18:02' }
      ] },
    { name: 'kurg_final_v3.mov', size: 3.42 * GB, kind: 'video',
      copies: [
        { path: '/Users/colin/Movies/kurg_final_v3.mov', mod: '2026-08-13T23:48' },
        { path: '/Users/colin/Movies/Projeler/kurg_final_v3.mov', mod: '2026-08-13T20:11' }
      ] },
    { name: 'sunum_tasarim_final.psd', size: 684.2 * MB, kind: 'image',
      copies: [
        { path: '/Users/colin/Desktop/sunum_tasarim_final.psd', mod: '2026-08-11T10:04' },
        { path: '/Users/colin/Documents/Araştırma/sunum_tasarim_final.psd', mod: '2026-08-10T16:40' }
      ] },
    { name: 'ekran_kaydi_2026-08-14.mov', size: 1.42 * GB, kind: 'video',
      copies: [
        { path: '/Users/colin/Desktop/ekran_kaydi_2026-08-14.mov', mod: '2026-08-14T17:22' },
        { path: '/Users/colin/Movies/ekran_kaydi_2026-08-14.mov', mod: '2026-08-14T17:30' }
      ] },
    { name: 'rapor_Q2_final_FINAL.pdf', size: 18.4 * MB, kind: 'doc',
      copies: [
        { path: '/Users/colin/Documents/Raporlar/rapor_Q2_final_FINAL.pdf', mod: '2026-07-02T16:18' },
        { path: '/Users/colin/Desktop/rapor_Q2_final_FINAL.pdf', mod: '2026-07-02T16:40' },
        { path: '/Users/colin/Downloads/rapor_Q2_final_FINAL.pdf', mod: '2026-07-03T09:12' }
      ] },
    { name: 'ps_kutuphane_v9.zip', size: 1.06 * GB, kind: 'archive',
      copies: [
        { path: '/Users/colin/Downloads/ps_kutuphane_v9.zip', mod: '2026-07-28T08:47' },
        { path: '/Users/colin/Downloads/Eski/karisik/ps_kutuphane_v9.zip', mod: '2026-07-20T11:05' },
        { path: '/Users/colin/Documents/Araştırma/ps_kutuphane_v9.zip', mod: '2026-07-28T10:30' }
      ] },
    { name: 'IMG_4021.jpg', size: 4.8 * MB, kind: 'image',
      copies: [
        { path: '/Users/colin/Pictures/Photos Library/IMG_4021.jpg', mod: '2026-06-21T14:02' },
        { path: '/Users/colin/Desktop/Eski Masaüstü/IMG_4021.jpg', mod: '2026-06-21T14:02' },
        { path: '/Users/colin/Downloads/IMG_4021.jpg', mod: '2026-06-22T09:41' },
        { path: '/Users/colin/Documents/Araştırma/IMG_4021.jpg', mod: '2026-06-25T13:00' },
        { path: '/Users/colin/Pictures/RAW Arşiv/IMG_4021.jpg', mod: '2026-06-21T14:02' }
      ] },
    { name: 'masa_yedegi.zip', size: 412.4 * MB, kind: 'archive',
      copies: [
        { path: '/Users/colin/Desktop/masa_yedegi.zip', mod: '2026-07-30T23:10' },
        { path: '/Users/colin/Downloads/Eski/masa_yedegi.zip', mod: '2026-07-30T23:12' }
      ] }
  ];

  /* ---- Demo: geçici dosya kategorileri ---- */
  const DEMO_TEMP = [
    { name: 'Uygulama Önbellekleri', icon: 'archive', color: '#5eb08b', risk: 'safe',
      items: [
        { name: 'DaVinci Resolve Cache', path: '/Library/Application Support/Blackmagic Design/Cache', size: 4.6 * GB },
        { name: 'Photoshop Cache', path: '/Users/colin/Library/Caches/Adobe', size: 3.1 * GB },
        { name: 'Spotlight İndeksi (eski)', path: '/System/Volumes/Data/.Spotlight-V100', size: 0.9 * GB },
        { name: 'Yardım Görüntüleyici', path: '/Library/Caches/com.apple.helpd', size: 1.2 * GB },
        { name: 'Xcode DerivedData', path: '/Users/colin/Library/Developer/DerivedData', size: 2.8 * GB }
      ] },
    { name: 'Geliştirici Artefaktları', icon: 'code', color: '#5c82a8', risk: 'caution',
      items: [
        { name: 'node_modules (12 proje)', path: '/Users/colin/Dev/**/node_modules', size: 3.2 * GB },
        { name: '.gradle önbelleği', path: '/Users/colin/.gradle/caches', size: 1.4 * GB },
        { name: 'CocoaPods', path: '/Users/colin/Library/Caches/CocoaPods', size: 0.9 * GB },
        { name: 'pip önbelleği', path: '/Users/colin/Library/Caches/pip', size: 0.6 * GB },
        { name: 'build/dist çıktıları', path: '/Users/colin/Dev/**/dist', size: 2.8 * GB }
      ] },
    { name: 'Çöp Kutusu', icon: 'trash', color: '#c9a15a', risk: 'safe',
      items: [
        { name: '.Trash içeriği', path: '/Users/colin/.Trash', size: 6.72 * GB }
      ] },
    { name: 'Tarayıcı Önbellekleri', icon: 'disk', color: '#69c19a', risk: 'safe',
      items: [
        { name: 'Chrome', path: '/Users/colin/Library/Caches/Google/Chrome', size: 1.8 * GB },
        { name: 'Safari', path: '/Library/Caches/com.apple.Safari', size: 0.9 * GB },
        { name: 'Firefox', path: '/Users/colin/Library/Caches/Firefox', size: 0.72 * GB }
      ] },
    { name: 'Sistem & Geçici Dosyalar', icon: 'timer', color: '#8a7fc9', risk: 'risk',
      items: [
        { name: '/private/var/folders (temp)', path: '/private/var/folders/zz', size: 1.4 * GB },
        { name: 'Takas dosyaları', path: '/System/Volumes/VM/swapfile*', size: 0.78 * GB },
        { name: 'FSEvents günlüğü', path: '/System/Volumes/Data/.fseventsd', size: 0.4 * GB }
      ] },
    { name: 'Loglar', icon: 'doc', color: '#4f9e94', risk: 'caution',
      items: [
        { name: 'install.log (eski)', path: '/var/log/install.log.*', size: 0.62 * GB },
        { name: 'Wi-Fi tanılamaları', path: '/Library/Logs/DiagnosticReports', size: 0.48 * GB },
        { name: 'system.log arşivi', path: '/var/log/system.log.*.gz', size: 0.54 * GB }
      ] },
    { name: 'Eski Yedekler & Kurulumcular', icon: 'disc', color: '#6a5f52', risk: 'caution',
      items: [
        { name: 'Eski DMG / PKG indirilenleri', path: '/Users/colin/Downloads/Eski', size: 3.02 * GB },
        { name: 'Yerel Time Machine anlık görüntüleri', path: '/System/Volumes/Data/.TimeMachine', size: 1.26 * GB }
      ] }
  ];

  /* ---- Rapor: sentetik büyüme (deterministik) ---- */
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0);
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function growthFor(name, months) {
    const rnd = mulberry32(hashStr(name));
    const end = 1, out = [];
    let cur = 0.62 + rnd() * 0.12;
    for (let i = 0; i < months - 1; i++) {
      out.push(cur);
      cur = Math.min(cur + 0.055 + rnd() * 0.06, 0.965);
    }
    out.push(end);
    return out;
  }

  window.Data = { demoDataset, emptyDataset, assignIds, DEMO_DUPES, DEMO_TEMP, growthFor, hashStr, mulberry32, MB, GB };
})();
