export function receiptPdfScope(receiptId: string) {
  return `receipt:${receiptId}:pdf`;
}
export function invoicePdfScope(invoiceId: string) {
  return `invoice:${invoiceId}:pdf`;
}
export function statementPdfScope(statementId: string) {
  return `statement:${statementId}:pdf`;
}
export function consolidatedStatementScope(customerId: string, from: string, to: string) {
  return `statement:customer:${customerId}:${from}:${to}:pdf`;
}
