const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('requestfailed', request => {
    console.log(`REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
  });
  
  page.on('response', response => {
    if (!response.ok()) {
      console.log(`RESPONSE ERROR: ${response.url()} - Status: ${response.status()}`);
    }
  });

  await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'admin@example.com');
  await page.type('input[type="password"]', 'admin123'); 
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {})
  ]);
  
  console.log('Navigating to dashboard...');
  await page.goto('http://localhost:3002/dashboard', { waitUntil: 'networkidle0' });
  
  console.log('Navigating to property ledger...');
  await page.goto('http://localhost:3002/reports/property-ledger', { waitUntil: 'networkidle0' });
  
  await new Promise(r => setTimeout(r, 2000));
  console.log('Finished monitoring.');
  
  await browser.close();
})();
