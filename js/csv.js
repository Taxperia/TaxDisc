/* CSV shared by reports and the review list; usable from Node tests too. */
(function (root) {
  'use strict';
  function cell(value) {
    let text = String(value == null ? '' : value);
    // File names are untrusted text, including when opened in a spreadsheet.
    if (typeof value === 'string' && /^[\s\uFEFF]*[=+@-]/u.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function serialize(rows) {
    return '\ufeff' + rows.map(row => row.map(cell).join(';')).join('\r\n') + '\r\n';
  }
  const api = { serialize };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TaxDiscCSV = api;
})(typeof window !== 'undefined' ? window : globalThis);
