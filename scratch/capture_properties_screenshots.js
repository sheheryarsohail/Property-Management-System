const puppeteer = require('/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/api/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/home/sheheryar-sohail/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  // 1. Desktop view
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:4002/login', { waitUntil: 'networkidle2' });
  await page.type('#login-email', 'sheheryarsohail3@gmail.com');
  await page.type('#login-password', 'password123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  // Set tenant to t_local
  await page.evaluate(() => {
    localStorage.setItem('tenant_id', 't_local');
  });

  // Navigate to Properties
  await page.goto('http://localhost:4002/properties', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: '/home/sheheryar-sohail/Downloads/Property-Management-System-main/scratch/properties_t_local.png' });

  // Open mobile drawer
  await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  // Click filter icon to show drawer
  const filterBtn = await page.$('button svg.lucide-sliders-horizontal');
  if (filterBtn) {
    const parent = await filterBtn.evaluateHandle(el => el.closest('button'));
    await parent.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: '/home/sheheryar-sohail/Downloads/Property-Management-System-main/scratch/properties_drawer.png' });
  }

  await browser.close();
  console.log('Screenshots captured successfully!');
})();
