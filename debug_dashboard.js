const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'shell' });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log('[browser]', msg.type(), msg.text());
  });
  page.on('pageerror', err => {
    console.log('[pageerror]', err.message);
  });

  const filePath = path.resolve(__dirname, 'dashboard.html');
  await page.goto('file:///' + filePath.replace(/\\/g, '/'));
  // wait some seconds
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
})();
