export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escapeCell = (value: string | number) => {
    let text = String(value);
    // Табличный редактор должен прочитать текст, а не выполнить формулу.
    if (/^[=+@\-]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const blob = new Blob(
    ['\ufeff' + rows.map((row) => row.map(escapeCell).join(';')).join('\r\n')],
    {
      type: 'text/csv;charset=utf-8;',
    },
  );
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
