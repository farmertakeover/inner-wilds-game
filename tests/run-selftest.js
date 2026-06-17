// Headless self-test runner for inner-wilds-game.html
// Usage: node tests/run-selftest.js [path-or-url]
// Loads the game with ?test, waits for the embedded QA suite, prints TEST_RESULTS.
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME = process.env.CHROME_PATH || '/usr/local/bin/google-chrome';

function resolveTarget(arg) {
  if (!arg) arg = path.resolve(__dirname, '..', 'inner-wilds-game.html');
  if (/^https?:\/\//.test(arg) || arg.startsWith('file://')) return arg;
  return 'file://' + path.resolve(arg);
}

(async () => {
  const base = resolveTarget(process.argv[2]);
  const url = base + (base.includes('?') ? '&test' : '?test');
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGE_ERROR: ' + e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('CONSOLE_ERROR: ' + msg.text());
  });
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });

  // Wait for the self-test panel to populate (suite runs ~2s after load).
  await page.waitForFunction(() => {
    const p = document.getElementById('qaPanel');
    return p && !p.hidden && /Self-test:/.test(p.textContent);
  }, { timeout: 30000 });

  const summary = await page.evaluate(() => {
    const p = document.getElementById('qaPanel');
    const m = p.textContent.match(/Self-test:\s*(\d+)\/(\d+)/);
    const fails = [...p.querySelectorAll('.fail')].map(s => s.parentElement.textContent.trim());
    return { passed: m ? +m[1] : 0, total: m ? +m[2] : 0, fails };
  });

  console.log(`Self-test: ${summary.passed}/${summary.total} passed`);
  if (summary.fails.length) {
    console.log('FAILURES:');
    summary.fails.forEach(f => console.log('  ' + f));
  }
  if (errors.length) {
    console.log('JS ERRORS:');
    errors.forEach(e => console.log('  ' + e));
  }
  await browser.close();
  process.exit(summary.total > 0 && summary.passed === summary.total && errors.length === 0 ? 0 : 1);
})().catch(e => { console.error('FATAL:', e.message); process.exit(2); });
