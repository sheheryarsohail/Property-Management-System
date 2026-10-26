const puppeteer = require('/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/api/node_modules/puppeteer');
const jwt = require('/home/sheheryar-sohail/Downloads/Property-Management-System-test/node_modules/.pnpm/jsonwebtoken@9.0.2/node_modules/jsonwebtoken');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/home/sheheryar-sohail/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });
  
  const token = jwt.sign(
    { email: 'sheheryarsohail3@gmail.com', sub: 'cmu2g5l810001y5gz4myztwd9', role: 'SUPER_ADMIN' },
    'super-secret-jwt-key-change-this-in-production-12345'
  );

  const userData = {
    id: 'cmu2g5l810001y5gz4myztwd9',
    email: 'sheheryarsohail3@gmail.com',
    name: 'Sheheryar Sohail',
    role: 'SUPER_ADMIN',
    authorizedTenants: [{ id: 't_local', name: 'Gulshan-e-Fatima' }]
  };

  console.log('1. Setting auth credentials in browser...');
  await page.goto('http://localhost:4002/login', { waitUntil: 'networkidle2' });
  await page.evaluate((tok, u) => {
    localStorage.setItem('access_token', tok);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('tenant_id', 't_local');
  }, token, userData);

  console.log('2. Navigating to Cash Flow report...');
  await page.goto('http://localhost:4002/reports/cash-flow', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));

  // Extract cards summary
  const summaryCards = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.rounded-xl.border.p-5, .rounded-xl.border.p-6'));
    return cards.map(c => c.innerText.replace(/\n+/g, ' | '));
  });
  console.log('Summary Cards on page:\n', summaryCards.join('\n'));

  // Extract column headers
  const columnHeaders = await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('h3.font-semibold'));
    return headers.map(h => h.innerText);
  });
  console.log('Column Headers:', columnHeaders);

  console.log('3. Clicking Export CSV and capturing content...');
  const csvText = await page.evaluate(async () => {
    let captured = null;
    const origCreate = window.URL.createObjectURL;
    window.URL.createObjectURL = (blob) => {
      const reader = new FileReader();
      reader.onload = () => {
        window.__csvResult = reader.result;
      };
      reader.readAsText(blob);
      return origCreate(blob);
    };

    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Export CSV'));
    if (btn) btn.click();
    
    await new Promise(r => setTimeout(r, 600));
    return window.__csvResult;
  });

  if (csvText) {
    const fs = require('fs');
    fs.writeFileSync('/home/sheheryar-sohail/Downloads/Property-Management-System-main/scratch/cash_flow_report_exported.csv', csvText);
    console.log('Successfully saved exported CSV to scratch/cash_flow_report_exported.csv!');
  } else {
    console.log('Warning: Could not capture CSV text');
  }

  await browser.close();
})();
