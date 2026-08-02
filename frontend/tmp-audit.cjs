const { chromium } = require('playwright');
const BASE = 'http://localhost:5173';

async function seedData(page) {
  // add a couple shopping items + a task so pages aren't empty
  await page.goto(BASE + '/shopping', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
}

(async () => {
  const browser = await chromium.launch();

  for (const theme of ['dark', 'light']) {
    for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await ctx.newPage();
      await page.addInitScript((t) => localStorage.setItem('tasker-theme', t), theme);

      await page.goto(BASE, { waitUntil: 'networkidle' });
      await page.fill('input[placeholder="Юзернейм"]', 'pasha');
      await page.fill('input[placeholder="Пароль"]', 'PashaNewPass123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1200);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const tag = `${theme}-${vp.name}`;

      // board + measure scroll
      const boardScroll = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ch: document.documentElement.clientHeight }));
      await page.screenshot({ path: `/tmp/aud-${tag}-board.png` });

      // task modal
      await page.click('text=Додати таску');
      await page.waitForTimeout(400);
      await page.screenshot({ path: `/tmp/aud-${tag}-taskmodal.png` });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // shopping
      await page.goto(BASE + '/shopping', { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      await page.screenshot({ path: `/tmp/aud-${tag}-shopping.png` });

      // shopping add modal
      await page.click('text=Додати');
      await page.waitForTimeout(400);
      await page.screenshot({ path: `/tmp/aud-${tag}-shopmodal.png` });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // admin
      await page.goto(BASE + '/admin', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const adminScroll = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ch: document.documentElement.clientHeight }));
      await page.screenshot({ path: `/tmp/aud-${tag}-admin.png` });

      // finance
      await page.goto(BASE + '/finance', { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      await page.screenshot({ path: `/tmp/aud-${tag}-finance.png` });

      console.log(`[${tag}] board scroll ${boardScroll.sh}/${boardScroll.ch} (overflow=${boardScroll.sh - boardScroll.ch}px) | admin scroll ${adminScroll.sh}/${adminScroll.ch} (overflow=${adminScroll.sh - adminScroll.ch}px)`);
      await ctx.close();
    }
  }

  await browser.close();
})().catch((e) => { console.error('AUDIT FAIL', e.message); process.exit(1); });
