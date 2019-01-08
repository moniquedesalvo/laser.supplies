const fs = require('fs');
const rp = require('request-promise');
const puppeteer = require('puppeteer');
const $ = require('cheerio');

async function additionalInfoViaItemUrl(itemUrl) {
  return rp(itemUrl)
    .then(function(html) {
      var name = $('h1', html).text();
      var configurations = [];
      var configurationsLength = $('#variety-table > tbody', html).find('tr', html).length;
      var price;
      var dimensions;
      var thickness;

      // TODO: sometimes technical specs table is out of order, add logic to find the right categories
      var color = $('#technical-specs > tbody', html).find('td > p', html).eq(1).text();
      var effect = $('#technical-specs > tbody', html).find('td > p', html).eq(3).text();
      var opacity = $('#technical-specs > tbody', html).find('td > p', html).eq(5).text();

      // configurations (price, dimensions, thickness)
      for (var i = 0; i < configurationsLength; i++) {
        // when price is unavailable, product is unavailable
        if ($('td > span[itemprop=price]', html).eq(i).attr('content') === undefined) {
          price = "Product Unavailable";
        } else {
          price = $('td > span[itemprop=price]', html).eq(i).attr('content');
        }
        // when item only has one option, there is no first column for radio button so the position of thickness and dimensions will be different 
        if (configurationsLength === 1) {
          dimensions = $('#variety-table > tbody', html).find('tr', html).eq(i).find('td', html).eq(2).text().trim();
          thickness = $('#variety-table > tbody', html).find('tr', html).eq(i).find('td', html).eq(3).text().trim();
        } else {
          dimensions = $('#variety-table > tbody', html).find('tr', html).eq(i).find('td', html).eq(3).text().trim()
          thickness = $('#variety-table > tbody', html).find('tr', html).eq(i).find('td', html).eq(4).text().trim();
        }
      
        configurations.push({
          price: price,
          dimensions: dimensions,
          thickness: thickness
        });
      }
      var itemInfo = [name, configurations, color, effect, opacity];
      return itemInfo;
  })
};

function extractItems() {
  const itemEls = document.querySelectorAll('ul.product-grid > li');
  const items = [];
  for (let itemEl of itemEls) {
    var imageSrc = itemEl.querySelector("img").getAttribute("src");
    var itemUrl = 'https://www.inventables.com' + itemEl.querySelector("a").getAttribute("href");
    items.push({
      itemUrl: itemUrl,
      materialType: "Acrylic",
      customCuts: false,
      imageSrc: imageSrc,
      supplier: "Inventables";
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
    item.name = additionalInfo[0];
    item.configurations = additionalInfo[1];
    item.color = additionalInfo[2];
    item.effect = additionalInfo[3];
    item.opacity = additionalInfo[4];
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
  fs.writeFileSync('./json/inventablesScraped.json', JSON.stringify(items, null, ' '));


  // Close the browser.
  await browser.close();
})();
