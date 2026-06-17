const { chromium } = require('/tmp/opencode/gstack/node_modules/playwright');

(async () => {
  const b = await chromium.launch({
    executablePath: '/nix/store/hqdgw5g4m4hwds79nsikncg9jglq3ajg-chromium-147.0.7727.101/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await b.newPage();
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));
  page.on('console', msg => console.log('[CONSOLE]', msg.type(), msg.text()));

  // Use ?test to auto-run QA
  await page.goto('file:///home/giovanniz/Documents/inner-wilds-game.html?test', {
    waitUntil: 'load',
    timeout: 15000,
  });

  await page.waitForTimeout(5000);

  const qaResults = await page.evaluate(() => {
    const panel = document.getElementById('qaPanel');
    return panel ? panel.innerText : 'no panel';
  });
  console.log('=== QA Panel (with ?test) ===');
  console.log(qaResults);

  // Check for specific visual elements
  const visualCheck = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return {
      width: canvas?.width,
      height: canvas?.height,
      hidden: canvas?.hidden,
    };
  });
  console.log('=== Canvas ===');
  console.log(JSON.stringify(visualCheck, null, 2));

  await page.screenshot({ path: '/tmp/opencode/game-qa-test.png', fullPage: true });
  console.log('Screenshot: /tmp/opencode/game-qa-test.png');

  await b.close();
  process.exit(0);
})().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});