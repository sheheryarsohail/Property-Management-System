export function invoiceHtml(data: {
  title: string;
  invoice: {
    seq: number; type: string; amount: number; issueDate: string | Date; dueDate: string | Date; status: string; notes?: string;
  };
  customer: { name: string; nic: string };
  property: { plotNo: string; type: string; block?: string | null };
}) {
  const fmt = (n: number) => n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const inv = data.invoice;

  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #222; margin: 28px; }
      h1 { font-size: 20px; margin: 0 0 12px; }
      .row { display: flex; gap: 24px; }
      .card { border: 1px solid #ddd; padding: 10px 12px; border-radius: 6px; flex: 1; }
      .muted { color: #666; }
      table { width: 100%; border-collapse: collapse; margin-top: 14px; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; }
      th { background: #f5f5f5; text-align: left; }
      .right { text-align: right; }
      .total { font-size: 16px; }
    </style>
    <title>${esc(data.title)}</title>
  </head>
  <body>
    <h1>${esc(data.title)}</h1>

    <div class="row">
      <div class="card">
        <div><b>Invoice #</b> ${esc(inv.seq)}</div>
        <div><b>Type</b> ${esc(inv.type)}</div>
        <div><b>Status</b> ${esc(inv.status)}</div>
        <div><b>Issue Date</b> ${new Date(inv.issueDate).toLocaleDateString()}</div>
        <div><b>Due Date</b> ${new Date(inv.dueDate).toLocaleDateString()}</div>
      </div>
      <div class="card">
        <div><b>Customer</b> ${esc(data.customer.name)}</div>
        <div><b>NIC</b> ${esc(data.customer.nic)}</div>
        <div><b>Property</b> ${esc(data.property.plotNo)} <span class="muted">(${esc(data.property.type)}${data.property.block ? ' • ' + esc(data.property.block) : ''})</span></div>
      </div>
    </div>

    <table>
      <thead>
        <tr><th>Description</th><th class="right" style="width: 160px;">Amount (PKR)</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>${esc(inv.type)} ${inv.notes ? '— ' + esc(inv.notes) : ''}</td>
          <td class="right">${fmt(inv.amount)}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td class="right"><b>Total</b></td>
          <td class="right total"><b>${fmt(inv.amount)}</b></td>
        </tr>
      </tfoot>
    </table>

    <p class="muted" style="margin-top:10px;">This is a system-generated document.</p>
  </body>
  </html>
  `;
}
