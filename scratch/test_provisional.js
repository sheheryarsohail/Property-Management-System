const puppeteer = require('/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/api/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/home/sheheryar-sohail/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1600 });
  
  console.log('1. Logging in...');
  await page.goto('http://localhost:4002/login', { waitUntil: 'networkidle2' });
  await page.type('#login-email', 'sheheryarsohail3@gmail.com');
  await page.type('#login-password', 'password123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2500));

  console.log('2. Screenshot sample provisional possession...');
  await page.goto('http://localhost:4002/print/provisional-possession/sample', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: '/home/sheheryar-sohail/Downloads/Property-Management-System-main/scratch/preview_provisional_sample.png', fullPage: true });

  console.log('3. Screenshot blank provisional possession...');
  await page.goto('http://localhost:4002/print/provisional-possession/blank', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: '/home/sheheryar-sohail/Downloads/Property-Management-System-main/scratch/preview_provisional_blank.png', fullPage: true });

  console.log('4. Screenshot real property provisional possession (R-53)...');
  await page.goto('http://localhost:4002/print/provisional-possession/cmshpo3zo0001k69zo99u9xo8', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: '/home/sheheryar-sohail/Downloads/Property-Management-System-main/scratch/preview_provisional_real_r53.png', fullPage: true });

  console.log('5. Screenshot Print Hub page...');
  await page.goto('http://localhost:4002/print', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: '/home/sheheryar-sohail/Downloads/Property-Management-System-main/scratch/preview_print_hub.png', fullPage: true });

  console.log('6. Screenshot property detail page...');
  await page.goto('http://localhost:4002/properties/cmshpo3zo0001k69zo99u9xo8', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: '/home/sheheryar-sohail/Downloads/Property-Management-System-main/scratch/preview_property_detail.png', fullPage: true });

  console.log('All screenshots captured successfully!');
  await browser.close();
})();
