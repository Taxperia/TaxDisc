/* Match complete directory components. A name alone never proves deletion safe. */
(function (root) {
  'use strict';
  const rules = [
    { name: 'Tarayıcı Önbellekleri', icon: 'disk', color: '#69c19a', risk: 'caution', re: /\/(?:google\/chrome|microsoft\/edge)\/user data\/(?:default|profile \d+)\/(?:cache|code cache|gpucache)(?:\/|$)|\/mozilla\/firefox\/profiles\/[^/]+\/cache2(?:\/|$)/i },
    { name: 'Uygulama Önbellekleri', icon: 'archive', color: '#5eb08b', risk: 'caution', re: /(?:^|\/)(?:cache|caches|\.cache|önbellek)(?:\/|$)/i },
    { name: 'Sistem & Geçici Dosyalar', icon: 'timer', color: '#8a7fc9', risk: 'risk', re: /(?:^|\/)(?:tmp|temp)(?:\/|$)/i },
    { name: 'Loglar', icon: 'doc', color: '#4f9e94', risk: 'caution', re: /(?:^|\/)(?:log|logs)(?:\/|$)/i },
    { name: 'Çöp Kutusu', icon: 'trash', color: '#c9a15a', risk: 'risk', re: /(?:^|\/)(?:\$recycle\.bin|\.trash|\.trashes)(?:\/|$)/i },
    { name: 'Geliştirici Çıktıları', icon: 'code', color: '#5c82a8', risk: 'caution', re: /(?:^|\/)(?:node_modules|__pycache__|\.gradle|deriveddata|dist|build)(?:\/|$)/i }
  ];
  function match(target, isFile = false) {
    const normalized = String(target).replace(/\\/g, '/');
    if (isFile) {
      if (/\.(?:tmp|temp)$/i.test(normalized) || /(?:^|\/)~\$/.test(normalized)) return 2;
      if (/\.log(?:\.\d+)?$/i.test(normalized)) return 3;
      return -1;
    }
    return rules.findIndex(rule => rule.re.test(normalized));
  }
  const api = { rules, match };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TaxDiscTempRules = api;
})(typeof window !== 'undefined' ? window : globalThis);
