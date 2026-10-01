// Helper to download structured JSON array as CSV
export const exportToCSV = (filename: string, rows: object[]) => {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const val = (row as any)[header] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper to open a styled print dialog for PDF export
export const exportToPDF = (title: string, htmlElementId?: string) => {
  const targetElement = htmlElementId ? document.getElementById(htmlElementId) : null;
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Please allow popups to export PDFs.');
    return;
  }

  const content = targetElement ? targetElement.innerHTML : document.body.innerHTML;

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #000; background: #fff; }
          h1 { text-align: center; font-size: 18px; margin-bottom: 20px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #333; padding: 8px; text-align: center; font-size: 12px; }
          th { background-color: #f2f2f2; font-weight: bold; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        ${content}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
};