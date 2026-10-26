const puppeteer = require('/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/api/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/home/sheheryar-sohail/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:4002/login', { waitUntil: 'networkidle2' });
  await page.type('#login-email', 'sheheryarsohail3@gmail.com');
  await page.type('#login-password', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  
  await page.goto('http://localhost:4002/receipts', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: '/home/sheheryar-sohail/Downloads/Property-Management-System-main/scratch/receipts_mobile_page.png' });
  
  // Inspect search input
  const searchDetails = await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="Search"]');
    if (!input) return 'no search input';
    const parent = input.parentElement;
    const svg = parent.querySelector('svg');
    return {
      parentTag: parent.tagName,
      parentClass: parent.className,
      inputClass: input.className,
      hasSvg: !!svg,
      svgClass: svg ? svg.getAttribute('class') : null,
      svgComputed: svg ? {
        display: window.getComputedStyle(svg).display,
        position: window.getComputedStyle(svg).position,
        left: window.getComputedStyle(svg).left,
        top: window.getComputedStyle(svg).top,
        width: window.getComputedStyle(svg).width,
        height: window.getComputedStyle(svg).height,
        color: window.getComputedStyle(svg).color,
        visibility: window.getComputedStyle(svg).visibility,
        opacity: window.getComputedStyle(svg).opacity,
      } : null,
      inputComputed: {
        paddingLeft: window.getComputedStyle(input).paddingLeft,
        paddingRight: window.getComputedStyle(input).paddingRight,
        fontSize: window.getComputedStyle(input).fontSize,
      }
    };
  });
  console.log('Search details:', JSON.stringify(searchDetails, null, 2));

  // Now click filter button to inspect drawer
  const filterBtn = await page.$('button[title*="Filter"], button[aria-label*="filter"]');
  if (filterBtn) {
    await filterBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: '/home/sheheryar-sohail/Downloads/Property-Management-System-main/scratch/receipts_drawer_opened.png' });
    
    const drawerDetails = await page.evaluate(() => {
      // Find drawer container
      const drawerRoots = Array.from(document.querySelectorAll('body > div')).filter(d => 
        d.textContent.includes('Filter Receipts')
      );
      return drawerRoots.map(d => ({
        class: d.className,
        rect: d.getBoundingClientRect(),
        computedBg: window.getComputedStyle(d).backgroundColor,
        computedBackdropFilter: window.getComputedStyle(d).backdropFilter,
        children: Array.from(d.children).map(c => ({
          tag: c.tagName,
          class: c.className,
          rect: c.getBoundingClientRect(),
          bg: window.getComputedStyle(c).backgroundColor,
        }))
      }));
    });
    console.log('Drawer details:', JSON.stringify(drawerDetails, null, 2));
  } else {
    console.log('No filter button found!');
  }

  await browser.close();
})();
