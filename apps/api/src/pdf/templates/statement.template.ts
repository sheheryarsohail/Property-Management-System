export function statementHtml(data: {
  title: string;
  property: { plotNo: string; type: string; status: string };
  range: { from: string | null; to: string | null };
  opening: { balance: number };
  entries: Array<{
    date: string | Date;
    label: string;
    debit: number;
    credit: number;
    balance: number;
    status?: string;
  }>;
  totals: { invoiced: number; received: number; closing: number };
}) {
  const fmt = (n: number) => n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const rows = data.entries.map(e => `
    <tr>
      <td>${new Date(e.date).toLocaleDateString()}</td>
      <td>${esc(e.label)}</td>
      <td class="num">${e.debit ? fmt(e.debit) : ''}</td>
      <td class="num">${e.credit ? fmt(e.credit) : ''}</td>
      <td class="num">${fmt(e.balance)}</td>
      <td>${esc(e.status ?? '')}</td>
    </tr>
  `).join('');

  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #222; margin: 24px; }
      h1 { font-size: 18px; margin: 0 0 8px; }
      .meta { margin-bottom: 12px; }
      .meta div { margin: 2px 0; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; }
      th { background: #f5f5f5; text-align: left; }
      td.num { text-align: right; }
      .totals { margin-top: 10px; }
      .totals td { border: none; padding: 2px 0; }
      .right { text-align: right; }
      .muted { color: #555; }
    </style>
    <title>${esc(data.title)}</title>
  </head>
  <body>
    <h1>${esc(data.title)}</h1>
    <div class="meta">
      <div><b>Property:</b> ${esc(data.property.plotNo)} &nbsp; <span class="muted">(${esc(data.property.type)} • ${esc(data.property.status)})</span></div>
      <div><b>Range:</b> ${esc(data.range.from ?? '—')} → ${esc(data.range.to ?? '—')}</div>
      <div><b>Opening Balance:</b> ${fmt(data.opening.balance)}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 90px;">Date</th>
          <th>Description</th>
          <th style="width: 110px;">Debit (Invoice)</th>
          <th style="width: 110px;">Credit (Receipt)</th>
          <th style="width: 110px;">Running Balance</th>
          <th style="width: 90px;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="6" class="muted" style="text-align:center;">No activity in this period</td></tr>'}
      </tbody>
    </table>

    <table class="totals" style="width: 100%; margin-top: 12px;">
      <tr><td class="right"><b>Period Invoiced:</b></td><td class="num" style="width: 130px; text-align:right;">${fmt(data.totals.invoiced)}</td></tr>
      <tr><td class="right"><b>Period Received:</b></td><td class="num" style="text-align:right;">${fmt(data.totals.received)}</td></tr>
      <tr><td class="right"><b>Closing Balance:</b></td><td class="num" style="text-align:right;"><b>${fmt(data.totals.closing)}</b></td></tr>
    </table>
  </body>
  </html>
  `;
}
