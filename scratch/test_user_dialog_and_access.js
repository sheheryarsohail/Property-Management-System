const puppeteer = require('/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/api/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/home/sheheryar-sohail/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  console.log('--- Step 1: Login as Super Admin ---');
  await page.goto('http://localhost:4002/login', { waitUntil: 'networkidle2' });
  await page.type('#login-email', 'sheheryarsohail3@gmail.com');
  await page.type('#login-password', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  console.log('Logged in. Current URL:', page.url());

  console.log('--- Step 2: Open Users page ---');
  await page.goto('http://localhost:4002/users', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  console.log('--- Step 3: Click Add User ---');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const addBtn = buttons.find(b => b.textContent.includes('Add User'));
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  console.log('--- Step 4: Fill form with restricted tabs ---');
  const testEmail = `sales_scope_${Date.now()}@property.com`;

  // Focus and type into inputs
  await page.type('input[placeholder*="John Doe"]', 'Sales Agent Limited');
  await page.type('input[placeholder*="john@"]', testEmail);
  await page.type('input[type="password"]', 'password123');

  // Click Clear All button
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const clearBtn = buttons.find(b => b.textContent.trim() === 'Clear All');
    if (clearBtn) clearBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Toggle on Properties and Transfers
  const propCard = await page.$('#tab-toggle-properties');
  if (propCard) await propCard.click();
  await new Promise(r => setTimeout(r, 200));

  const transferCard = await page.$('#tab-toggle-transfers');
  if (transferCard) await transferCard.click();
  await new Promise(r => setTimeout(r, 200));

  await page.screenshot({ path: '/home/sheheryar-sohail/Downloads/Property-Management-System-main/scratch/dialog_configured_tabs.png' });
  console.log('Saved dialog_configured_tabs.png');

  console.log('--- Step 5: Submit form ---');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const submitBtn = buttons.find(b => b.textContent.includes('Create User'));
    if (submitBtn) submitBtn.click();
  });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: '/home/sheheryar-sohail/Downloads/Property-Management-System-main/scratch/users_list_after_create.png' });

  // Read users table to confirm new user
  const tableData = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    return rows.map(r => r.textContent.replace(/\s+/g, ' ').trim());
  });
  console.log('Users in table:', tableData.slice(0, 4));

  console.log('--- Step 6: Log out and test new restricted user ---');
  await page.evaluate(() => {
    localStorage.clear();
    window.location.href = '/login';
  });
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  console.log('--- Step 7: Log in as newly created restricted user ---');
  await page.type('#login-email', testEmail);
  await page.type('#login-password', 'password123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2500));
  console.log('URL after restricted user login:', page.url());

  // Check which sidebar items are visible
  const visibleNavLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('nav a'));
    return links.map(a => a.textContent.trim());
  });
  console.log('>>> Visible sidebar links for restricted user:', visibleNavLinks);

  await page.screenshot({ path: '/home/sheheryar-sohail/Downloads/Property-Management-System-main/scratch/restricted_user_view.png' });

  console.log('--- Step 8: Test direct URL navigation to unauthorized tab (/reports) ---');
  await page.goto('http://localhost:4002/reports', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  console.log('URL after attempting unauthorized /reports:', page.url());

  await browser.close();
  console.log('Test completed successfully!');
})();
