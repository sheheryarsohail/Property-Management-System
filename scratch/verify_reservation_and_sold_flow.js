const API_BASE = 'http://localhost:4001';
const headers = {
  'Content-Type': 'application/json',
  'x-api-key': 'dev-key-local',
  'x-tenant-id': 't_local'
};

async function api(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { ...headers, ...(options.headers || {}) },
    ...options
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(`API error ${res.status} on ${path}: ${JSON.stringify(data)}`);
    err.data = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

async function run() {
  console.log('--- STARTING RESERVATION & SOLD FLOW VERIFICATION ---');

  // 1. Get an existing customer
  const customersRes = await api('/customers');
  const customers = customersRes.items || customersRes;
  if (!customers || customers.length === 0) {
    throw new Error('No customers found in database');
  }
  const testCustomer = customers[0];
  console.log(`✓ Using Customer: ${testCustomer.fullName} (${testCustomer.id})`);

  // 2. Create a fresh test property
  const propCode = `TEST-RES-${Date.now().toString().slice(-4)}`;
  const property = await api('/properties', {
    method: 'POST',
    body: JSON.stringify({
      code: propCode,
      title: `Automated Test Plot ${propCode}`,
      type: 'RESIDENTIAL',
      sizeSqYd: 120,
      pricePerSqYd: 10000,
      totalPrice: 1200000,
      bookingPrice: 120000,
      bookingMonths: 1,
      confirmationPrice: 120000,
      confirmationMonths: 1,
      installmentPrice: 80000,
      installmentMonths: 12,
    })
  });

  console.log(`✓ Created test property: ${property.code} (${property.id})`);
  console.log(`  Initial Property Status: ${property.status}`);
  if (property.status !== 'AVAILABLE') {
    throw new Error(`Expected initial status to be AVAILABLE, got ${property.status}`);
  }

  // 3. Assign property to customer
  console.log('\n--- STEP 1: Assigning Property to Customer ---');
  await api('/ownerships', {
    method: 'POST',
    body: JSON.stringify({
      propertyId: property.id,
      customerId: testCustomer.id,
      startDate: new Date().toISOString(),
    })
  });
  console.log('✓ Ownership assigned successfully');

  // 4. Verify property status is now RESERVED (not SOLD)
  const propAfterAssign = await api(`/properties/${property.id}`);
  console.log(`  Property Status after assignment: ${propAfterAssign.status}`);
  if (propAfterAssign.status !== 'RESERVED') {
    throw new Error(`FAILURE: Expected status to be 'RESERVED' while booking/confirmation pending, got '${propAfterAssign.status}'`);
  }
  console.log('✓ SUCCESS: Property status is RESERVED (not SOLD)!');

  // 5. Verify preliminary invoices generated, and ZERO installment invoices
  const invoicesRes = await api(`/invoices?propertyId=${property.id}`);
  const invoices = invoicesRes.data || invoicesRes.items || (Array.isArray(invoicesRes) ? invoicesRes : []);
  console.log(`  Total invoices created: ${invoices.length}`);
  
  const bookingInv = invoices.find(i => i.type === 'BOOKING');
  const confInv = invoices.find(i => i.type === 'CONFIRMATION');
  const instInvs = invoices.filter(i => i.type === 'INSTALLMENT');

  console.log(`  Booking Invoice: ${bookingInv ? `${bookingInv.code} (Status: ${bookingInv.status}, Total: ${bookingInv.total})` : 'MISSING'}`);
  console.log(`  Confirmation Invoice: ${confInv ? `${confInv.code} (Status: ${confInv.status}, Total: ${confInv.total})` : 'MISSING'}`);
  console.log(`  Installment Invoices Count: ${instInvs.length}`);

  if (!bookingInv || !confInv) {
    throw new Error('FAILURE: Booking or Confirmation invoice was not generated upfront');
  }
  if (instInvs.length !== 0) {
    throw new Error(`FAILURE: Expected 0 installment invoices before booking/confirmation paid, found ${instInvs.length}`);
  }
  console.log('✓ SUCCESS: Only Booking & Confirmation invoices exist. Zero installments generated upfront!');

  // 6. Pay the BOOKING invoice
  console.log('\n--- STEP 2: Paying Booking Invoice ---');
  const bookReceiptRes = await api('/receipts', {
    method: 'POST',
    body: JSON.stringify({
      propertyId: property.id,
      customerId: testCustomer.id,
      invoiceId: bookingInv.id,
      amount: Number(bookingInv.total),
      method: 'CASH',
      notes: 'Booking payment automated test',
    })
  });
  console.log(`✓ Receipt generated: ${bookReceiptRes.code}`);

  // Re-check property status & invoices
  const propAfterBooking = await api(`/properties/${property.id}`);
  const rawBookingInvs = await api(`/invoices?propertyId=${property.id}`);
  const invsAfterBooking = rawBookingInvs.data || rawBookingInvs.items || [];
  const updatedBookingInv = invsAfterBooking.find(i => i.id === bookingInv.id);
  const updatedConfInv = invsAfterBooking.find(i => i.id === confInv.id);
  const instAfterBooking = invsAfterBooking.filter(i => i.type === 'INSTALLMENT');

  console.log(`  Booking Invoice Status: ${updatedBookingInv.status}`);
  console.log(`  Confirmation Invoice Status: ${updatedConfInv.status}`);
  console.log(`  Property Status: ${propAfterBooking.status}`);
  console.log(`  Installment Invoices Count: ${instAfterBooking.length}`);

  if (updatedBookingInv.status !== 'PAID') {
    throw new Error(`Booking invoice should be PAID, got ${updatedBookingInv.status}`);
  }
  if (propAfterBooking.status !== 'RESERVED') {
    throw new Error(`FAILURE: Property status must still be 'RESERVED' because Confirmation is pending, got '${propAfterBooking.status}'`);
  }
  if (instAfterBooking.length !== 0) {
    throw new Error(`FAILURE: Installment invoices should not be generated until Confirmation is also paid! Found: ${instAfterBooking.length}`);
  }
  console.log('✓ SUCCESS: Property status correctly remains RESERVED, and zero installments created!');

  // 7. Pay the CONFIRMATION invoice
  console.log('\n--- STEP 3: Paying Confirmation Invoice ---');
  const confReceiptRes = await api('/receipts', {
    method: 'POST',
    body: JSON.stringify({
      propertyId: property.id,
      customerId: testCustomer.id,
      invoiceId: confInv.id,
      amount: Number(confInv.total),
      method: 'BANK_TRANSFER',
      notes: 'Confirmation payment automated test',
    })
  });
  console.log(`✓ Receipt generated: ${confReceiptRes.code}`);

  // Re-check property status & invoices
  const propAfterConf = await api(`/properties/${property.id}`);
  const rawConfInvs = await api(`/invoices?propertyId=${property.id}`);
  const invsAfterConf = rawConfInvs.data || rawConfInvs.items || [];
  const finalBookingInv = invsAfterConf.find(i => i.id === bookingInv.id);
  const finalConfInv = invsAfterConf.find(i => i.id === confInv.id);
  const finalInstInvs = invsAfterConf.filter(i => i.type === 'INSTALLMENT');

  console.log(`  Booking Invoice Status: ${finalBookingInv.status}`);
  console.log(`  Confirmation Invoice Status: ${finalConfInv.status}`);
  console.log(`  Property Status: ${propAfterConf.status}`);
  console.log(`  Installment Invoices Count: ${finalInstInvs.length}`);

  if (propAfterConf.status !== 'SOLD') {
    throw new Error(`FAILURE: Expected property status to transition to 'SOLD' once both booking & confirmation are paid, got '${propAfterConf.status}'`);
  }
  if (finalInstInvs.length === 0) {
    throw new Error('FAILURE: Expected installment invoices to be generated automatically upon booking & confirmation payment!');
  }
  console.log('✓ SUCCESS: Property status transitioned to SOLD!');
  console.log(`✓ SUCCESS: ${finalInstInvs.length} installment invoices automatically created!`);

  // 8. Clean up test records via docker psql
  console.log('\n--- CLEANING UP TEST DATA ---');
  const { execSync } = require('child_process');
  execSync(`docker exec pms_postgres psql -U pms -d pms_test -c "
    DELETE FROM \\"Receipt\\" WHERE \\"propertyId\\" = '${property.id}';
    DELETE FROM \\"Invoice\\" WHERE \\"propertyId\\" = '${property.id}';
    DELETE FROM \\"PlanInstallment\\" WHERE \\"planId\\" IN (SELECT id FROM \\"PaymentPlan\\" WHERE \\"propertyId\\" = '${property.id}');
    DELETE FROM \\"PaymentPlan\\" WHERE \\"propertyId\\" = '${property.id}';
    DELETE FROM \\"Ownership\\" WHERE \\"propertyId\\" = '${property.id}';
    DELETE FROM \\"Property\\" WHERE id = '${property.id}';
  "`);
  console.log('✓ Test data cleaned up successfully');

  console.log('\n================================================================');
  console.log('✅ ALL ASSERTIONS PASSED! RESERVATION -> SOLD FLOW IS 100% OPERATIONAL');
  console.log('================================================================');
}

run().catch(err => {
  console.error('\n❌ TEST ERROR:', err.data || err.message || err);
  process.exit(1);
});
