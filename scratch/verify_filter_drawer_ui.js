const puppeteer = require('/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/api/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/home/sheheryar-sohail/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
  
  console.log('Logging in...');
  await page.goto('http://localhost:4002/login', { waitUntil: 'networkidle2' });
  await page.type('#login-email', 'sheheryarsohail3@gmail.com');
  await page.type('#login-password', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // 1. Properties Drawer
  console.log('\n--- Checking /properties drawer ---');
  await page.goto('http://localhost:4002/properties', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  // Find and click filter button
  const propFilterBtn = await page.$('button[title*="Filter"], button[aria-label*="filter"]');
  if (propFilterBtn) {
    await propFilterBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: '/home/sheheryar-sohail/Downloads/Property-Management-System-main/scratch/properties_drawer.png' });

    const propInfo = await page.evaluate(() => {
      const heading = document.querySelector('h3');
      const headerText = heading ? heading.innerText.trim() : null;
      // Check for top reset button
      const allButtons = Array.from(document.querySelectorAll('button'));
      const topResetBtn = allButtons.find(b => b.innerText.trim() === 'Reset');
      const clearAllBtn = allButtons.find(b => b.innerText.trim() === 'Clear All');
      const subHeadingP = Array.from(document.querySelectorAll('p')).find(p => p.innerText.includes('Filter criteria'));
      const hasSubHeadingText = Array.from(document.querySelectorAll('div')).some(d => d.innerText.includes('Ready for new bookings'));

      return {
        headerHeading: headerText,
        hasTopResetButton: !!topResetBtn,
        hasClearAllButton: !!clearAllBtn,
        hasSubHeadingInHeader: !!subHeadingP,
        hasItemDescriptionText: hasSubHeadingText,
      };
    });
    console.log('Properties Drawer Result:', propInfo);
    
    // Close drawer
    const closeBtn = await page.$('button[aria-label="Close filter"]');
    if (closeBtn) await closeBtn.click();
    await new Promise(r => setTimeout(r, 400));
  } else {
    console.error('Filter button not found on properties page');
  }

  // 2. Receipts Drawer
  console.log('\n--- Checking /receipts drawer ---');
  await page.goto('http://localhost:4002/receipts', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  const receiptsFilterBtn = await page.$('button[title*="Filter"], button[aria-label*="filter"]');
  if (receiptsFilterBtn) {
    await receiptsFilterBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: '/home/sheheryar-sohail/Downloads/Property-Management-System-main/scratch/receipts_drawer.png' });

    const receiptsInfo = await page.evaluate(() => {
      const heading = document.querySelector('h3');
      const headerText = heading ? heading.innerText.trim() : null;
      const allButtons = Array.from(document.querySelectorAll('button'));
      const topResetBtn = allButtons.find(b => b.innerText.trim() === 'Reset');
      const clearAllBtn = allButtons.find(b => b.innerText.trim() === 'Clear All');
      const subHeadingP = Array.from(document.querySelectorAll('p')).find(p => p.innerText.includes('Filter criteria'));
      const hasItemDesc = Array.from(document.querySelectorAll('div')).some(d => d.innerText.includes('Plot installments, down payments'));

      return {
        headerHeading: headerText,
        hasTopResetButton: !!topResetBtn,
        hasClearAllButton: !!clearAllBtn,
        hasSubHeadingInHeader: !!subHeadingP,
        hasItemDescriptionText: hasItemDesc,
      };
    });
    console.log('Receipts Drawer Result:', receiptsInfo);

    const closeBtn = await page.$('button[aria-label="Close filter"]');
    if (closeBtn) await closeBtn.click();
    await new Promise(r => setTimeout(r, 400));
  } else {
    console.error('Filter button not found on receipts page');
  }

  // 3. Transfers Drawer
  console.log('\n--- Checking /transfers drawer ---');
  await page.goto('http://localhost:4002/transfers', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  const transfersFilterBtn = await page.$('button[title*="Filter"], button[aria-label*="filter"]');
  if (transfersFilterBtn) {
    await transfersFilterBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: '/home/sheheryar-sohail/Downloads/Property-Management-System-main/scratch/transfers_drawer.png' });

    const transfersInfo = await page.evaluate(() => {
      const heading = document.querySelector('h3');
      const headerText = heading ? heading.innerText.trim() : null;
      const allButtons = Array.from(document.querySelectorAll('button'));
      const topResetBtn = allButtons.find(b => b.innerText.trim() === 'Reset');
      const clearAllBtn = allButtons.find(b => b.innerText.trim() === 'Clear All');
      const subHeadingP = Array.from(document.querySelectorAll('p')).find(p => p.innerText.includes('Filter criteria'));
      const hasItemDesc = Array.from(document.querySelectorAll('div')).some(d => d.innerText.includes('Pending verification and final approval'));

      return {
        headerHeading: headerText,
        hasTopResetButton: !!topResetBtn,
        hasClearAllButton: !!clearAllBtn,
        hasSubHeadingInHeader: !!subHeadingP,
        hasItemDescriptionText: hasItemDesc,
      };
    });
    console.log('Transfers Drawer Result:', transfersInfo);
  } else {
    console.error('Filter button not found on transfers page');
  }

  await browser.close();
  console.log('\nAll checks completed successfully!');
})();
