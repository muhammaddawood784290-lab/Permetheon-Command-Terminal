// =====================================================================
// csvExport — tiny CSV builder + browser download trigger.
//
// No dependency on papaparse or similar. The output is RFC-4180-ish:
// values containing commas, double-quotes or newlines are quoted and
// inner double-quotes are escaped by doubling. The caller passes the
// filename with extension; the MIME type is forced to text/csv so the
// browser handles the download prompt cleanly.
// =====================================================================

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(headers, rows) {
  const lines = [];
  if (Array.isArray(headers) && headers.length > 0) {
    lines.push(headers.map(escapeCell).join(','));
  }
  if (Array.isArray(rows)) {
    rows.forEach((row) => {
      lines.push(row.map(escapeCell).join(','));
    });
  }
  // Prepend BOM so Excel opens UTF-8 files correctly.
  return `﻿${lines.join('\r\n')}`;
}

export function downloadCsv(filename, headers, rows) {
  if (typeof window === 'undefined') return;
  const csv = buildCsv(headers, rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default { buildCsv, downloadCsv };