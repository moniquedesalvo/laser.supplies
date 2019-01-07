const fs = require('fs');
const rp = require('request-promise');
const puppeteer = require('puppeteer');
const $ = require('cheerio');

async function additionalInfoViaItemUrl(itemUrl) {
  return rp(itemUrl)
    .then(function(html) {
      var configurationsLength = $('tbody',html).eq(0).find('tr', html).length;
      console.log(configurationsLength)
      var configurations = [];
      for (var i = 0; i < configurationsLength; i++) {
        configurations.push({
          price: $('td > span[itemprop=price]', html).eq(i).attr('content'),
          // $('tbody').eq(0).find('tr').eq(1).find('td').eq(3).text().trim();
          dimensions: $('tbody', html).eq(0).find('tr', html).eq(i).find('td', html).eq(3).text().trim(),
          thickness: $('tbody', html).eq(0).find('tr', html).eq(i).find('td', html).eq(4).text().trim()
        })
      }
      // itemInfo[0] is name
      var itemInfo = [$('h1', html).text(), configurations];
      return itemInfo;
  })
};

function extractItems() {
  const itemEls = document.querySelectorAll('ul.product-grid > li');
  const items = [];
  for (let itemEl of itemEls) {
    var imageSrc = itemEl.querySelector("img").getAttribute("src");
    var itemUrl = 'https://www.inventables.com' + itemEl.querySelector("a").getAttribute("href");
    var supplier = "Inventables";
    // var opacity = "";
    // var color = 
    // var effect = 
    items.push({
      itemUrl: itemUrl,
      materialType: "Acrylic",
      customCuts: false,
      imageSrc: imageSrc
    });
  }
  return items;
}

async function extractAdditionalInfo(items) {
  // mutate items
  for(var i = 0; i < items.length; i++) {
    var item = items[i];
    var additionalInfo = await additionalInfoViaItemUrl(item.itemUrl);
    console.log("Extracting item from " + item.itemUrl);
    item.thickness = "1/4";
    item.name = additionalInfo[0];
    item.configurations = additionalInfo[1];
  }
  return items;
}

//using puppeteer to handle infinite scroll
async function scrapeInfiniteScrollItems(
  page,
  extractItems,
  itemTargetCount,
  scrollDelay = 1500,
) {
  let items = [];
  try {
    let previousHeight;
    while (items.length < itemTargetCount) {
      previousHeight = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
      await page.waitFor(scrollDelay);
      items = await page.evaluate(extractItems);
      console.log("Extracted " + items.length + " items");
    }
  } catch(e) {
    console.log("There was an error: ", e);
  }
  await extractAdditionalInfo(items);
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
  const items = await scrapeInfiniteScrollItems(page, extractItems, 10);

  // Save extracted items to a file.
  // fs.writeFileSync('./items.txt', items.join('\n') + '\n');

  fs.writeFileSync('./json/inventablesScraped.json', JSON.stringify(items, null, ' '));


  // Close the browser.
  await browser.close();
})();
