const { chromium } = require('/tmp/opencode/gstack/node_modules/playwright');

(async () => {
  const b = await chromium.launch({
    executablePath: '/nix/store/hqdgw5g4m4hwds79nsikncg9jglq3ajg-chromium-147.0.7727.101/bin/chromium',
    headless: false,
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await b.newPage();
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));
  page.on('console', msg => console.log('[CONSOLE]', msg.type(), msg.text()));

  const gameUrl = process.env.GAME_URL || 'file:///home/giovanniz/Documents/inner-wilds-game.html';
  await page.goto(gameUrl, {
    waitUntil: 'load',
    timeout: 15000,
  });

  console.log('=== Game loaded - starting automated play ===');
  
  // Click Start Game
  await page.click('#startBtn');
  console.log('Clicked Start Game');
  await page.waitForTimeout(2000);

  // Get canvas for pointer lock
  const canvas = await page.locator('canvas');
  
  // Focus canvas and request pointer lock
  await canvas.focus();
  await page.mouse.click(640, 360); // Center click to request pointer lock
  console.log('Requested pointer lock');
  await page.waitForTimeout(1000);

  // Move forward (W)
  console.log('Moving forward...');
  await page.keyboard.down('w');
  await page.waitForTimeout(3000);
  await page.keyboard.up('w');
  await page.waitForTimeout(500);

  // Look around (mouse move)
  console.log('Looking around...');
  await page.mouse.move(500, 360);
  await page.waitForTimeout(500);
  await page.mouse.move(780, 360);
  await page.waitForTimeout(500);
  await page.mouse.move(640, 200);
  await page.waitForTimeout(500);
  await page.mouse.move(640, 520);
  await page.waitForTimeout(500);

  // Jump
  console.log('Jumping...');
  await page.keyboard.press('Space');
  await page.waitForTimeout(1000);

  // Open crafting (C)
  console.log('Opening crafting (C)...');
  await page.keyboard.press('c');
  await page.waitForTimeout(1000);
  
  // Check crafting UI
  const craftingOpen = await page.evaluate(() => 
    document.getElementById('craftingPanel')?.classList.contains('open')
  );
  console.log('Crafting open:', craftingOpen);
  
  // Close crafting
  await page.keyboard.press('c');
  await page.waitForTimeout(500);

  // Open menu (M)
  console.log('Opening menu (M)...');
  await page.keyboard.press('m');
  await page.waitForTimeout(1000);
  
  // Click Settings
  await page.click('#settingsBtn');
  console.log('Clicked Settings');
  await page.waitForTimeout(1000);
  
  // Close menu
  await page.click('#settingsStartBtn');
  console.log('Closed menu');
  await page.waitForTimeout(500);

  // Try mining - hold left click
  console.log('Testing mining...');
  await page.mouse.down();
  await page.waitForTimeout(2000);
  await page.mouse.up();
  await page.waitForTimeout(500);

  // Try placing - right click
  console.log('Testing place...');
  await page.mouse.click(640, 360, { button: 'right' });
  await page.waitForTimeout(500);

  // Interact (E)
  console.log('Testing interact (E)...');
  await page.keyboard.press('e');
  await page.waitForTimeout(1000);

  // Take screenshot
  await page.screenshot({ path: '/tmp/opencode/game-played.png', fullPage: true });
  console.log('Screenshot saved');

  console.log('=== Automated play complete ===');
  console.log('Browser will stay open for 10s for manual inspection...');
  await page.waitForTimeout(10000);

  await b.close();
  process.exit(0);
})().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
