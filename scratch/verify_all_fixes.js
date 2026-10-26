const puppeteer = require('/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/api/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/home/sheheryar-sohail/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
  
  // 1. Login
  await page.goto('http://localhost:4002/login', { waitUntil: 'networkidle2' });
  await page.type('#login-email', 'sheheryarsohail3@gmail.com');
  await page.type('#login-password', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  
  // 2. Go to /receipts
  await page.goto('http://localhost:4002/receipts', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // Screenshot search bar on mobile
  await page.screenshot({ path: '/home/sheheryar-sohail/Downloads/Property-Management-System-main/scratch/verified_receipts_search.png' });
  
  const searchMetrics = await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="Search"]');
    const container = input.parentElement;
    const svg = container.querySelector('svg');
    const cRect = container.getBoundingClientRect();
    const iRect = input.getBoundingClientRect();
    const sRect = svg ? svg.getBoundingClientRect() : null;
    return {
      containerRect: { top: cRect.top, left: cRect.left, width: cRect.width, height: cRect.height },
      svgRect: sRect ? { top: sRect.top, left: sRect.left, width: sRect.width, height: sRect.height } : null,
      inputRect: { top: iRect.top, left: iRect.left, width: iRect.width, height: iRect.height },
      distanceFromIconToInput: sRect ? (iRect.left - (sRect.left + sRect.width)) : null,
      inputComputedPaddingLeft: window.getComputedStyle(input).paddingLeft,
      inputBg: window.getComputedStyle(input).backgroundColor,
    };
  });
  console.log('Search Metrics:', JSON.stringify(searchMetrics, null, 2));

  // 3. Open Filter Drawer
  const filterBtn = await page.$('button[title*="Filter"], button[aria-label*="filter"]');
  if (filterBtn) {
    await filterBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: '/home/sheheryar-sohail/Downloads/Property-Management-System-main/scratch/verified_receipts_drawer.png' });

    const drawerMetrics = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*')).filter(e => e.textContent && e.textContent.includes('Filter Receipts'));
      const panel = all.find(e => e.className && e.className.includes('slide-in-from-left'));
      if (!panel) return 'panel not found';
      const r = panel.getBoundingClientRect();
      const hr = panel.children[0].getBoundingClientRect();
      return {
        panelRect: { top: r.top, y: r.y, left: r.left, width: r.width, height: r.height },
        headerRect: { top: hr.top, y: hr.y, left: hr.left, width: hr.width, height: hr.height },
        panelBg: window.getComputedStyle(panel).backgroundColor,
        panelBackdropFilter: window.getComputedStyle(panel).backdropFilter,
        headerBg: window.getComputedStyle(panel.children[0]).backgroundColor,
        bodyBg: window.getComputedStyle(panel.children[1]).backgroundColor,
      };
    });
    console.log('Drawer Metrics:', JSON.stringify(drawerMetrics, null, 2));
  }

  // 4. Test Modal (e.g. Users Page -> Add User modal)
  await page.goto('http://localhost:4002/users', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));
  const addUserBtn = await page.$('button:has(svg), button');
  const allBtns = await page.$$('button');
  for (const b of allBtns) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Add User')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: '/home/sheheryar-sohail/Downloads/Property-Management-System-main/scratch/verified_user_modal.png' });

  const modalMetrics = await page.evaluate(() => {
    const dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) return 'no dialog found';
    return {
      dialogBg: window.getComputedStyle(dialog).backgroundColor,
      dialogBorder: window.getComputedStyle(dialog).border,
      dialogBackdropFilter: window.getComputedStyle(dialog).backdropFilter,
      overlay: dialog.parentElement ? {
        overlayBg: window.getComputedStyle(dialog.parentElement.querySelector('div[class*="fixed"]')).backgroundColor,
        overlayBackdropFilter: window.getComputedStyle(dialog.parentElement.querySelector('div[class*="fixed"]')).backdropFilter,
      } : null
    };
  });
  console.log('Modal Metrics:', JSON.stringify(modalMetrics, null, 2));

  await browser.close();
})();
