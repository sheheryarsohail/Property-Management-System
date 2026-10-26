const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // Login first to get past AuthGuard
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'admin@example.com');
  await page.type('input[type="password"]', 'admin123'); // guessing standard credentials
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle0' })
  ]);
  
  await page.goto('http://localhost:3000/reports/property-ledger', { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: 'screenshot.png' });
  const htmlLength = await page.evaluate(() => document.body.innerHTML.length);
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('HTML Length:', htmlLength);
  console.log('Body Text:', bodyText);
  
  await browser.close();
})();
