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

  // Use ?test param to auto-start
  await page.goto('file:///home/giovanniz/Documents/inner-wilds-game.html?test', {
    waitUntil: 'load',
    timeout: 15000,
  });

  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/tmp/opencode/game-test-auto.png', fullPage: false });

  // Check game state
  const state = await page.evaluate(() => {
    return {
      started: window.state?.started,
      chunks: window.chunks?.size,
      meshes: window.chunkMeshes?.size,
      agents: window.agents?.length,
      playerPos: window.player?.pos ? {x: window.player.pos.x, y: window.player.pos.y, z: window.player.pos.z} : null,
      menuHidden: window.ui?.start?.classList?.contains('hidden'),
    };
  });
  
  console.log('=== Game State (with ?test) ===');
  console.log(JSON.stringify(state, null, 2));
  console.log('Screenshot: /tmp/opencode/game-test-auto.png');

  await b.close();
  process.exit(0);
})().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});