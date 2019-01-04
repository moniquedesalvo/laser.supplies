const fs = require('fs');
const rp = require('request-promise');
const puppeteer = require('puppeteer');
const url = 'https://www.inventables.com/categories/materials/acrylic';

// puppeteer
//   .launch()
//   .then(function(browser) {
//     return browser.newPage();
//   })
//   .then(function(page) {
//     return page.goto(url).then(function() {
//       return page.content();
//     });
//   })
//   .then(function(html) {
//     // console.log(html);
//     console.log($('h4 > a', html).length);
//     console.log($('h4 > a', html));
//   })
//   .catch(function(err) {
//     //handle error
//   });

  function extractItems() {
  const itemEls = document.querySelectorAll('ul.product-grid > li');
  const items = [];
  for (let itemEl of itemEls) {
    var src = itemEl.querySelector("img").getAttribute("src");
    items.push({imageSrc: src});
  }
  return items;
}

async function scrapeInfiniteScrollItems(
  page,
  extractItems,
  itemTargetCount,
  scrollDelay = 1000,
) {
  let items = [];
  try {
    let previousHeight;
    while (items.length < itemTargetCount) {
      items = await page.evaluate(extractItems);
      previousHeight = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
      await page.waitFor(scrollDelay);
    }
  } catch(e) { }
  return items;
}

(async () => {
  // Set up browser and page.
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 926 });

  // Navigate to the page.
  await page.goto('https://www.inventables.com/categories/materials/acrylic');

  // Scroll and extract items from the page.
  const items = await scrapeInfiniteScrollItems(page, extractItems, 134);

  // Save extracted items to a file.
  // fs.writeFileSync('./items.txt', items.join('\n') + '\n');
  fs.writeFileSync('./json/inventables.json', JSON.stringify(items));


  // Close the browser.
  await browser.close();
})();
