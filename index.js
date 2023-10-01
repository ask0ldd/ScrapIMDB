const puppeeter = require('puppeteer')

async function run (){
    const browser = await puppeeter.launch()
    const page = await browser.newPage()
    
    // fake user agent
    await page.evaluateOnNewDocument(() => {
        Object.defineProperties(navigator, 'platform', {get : () => 'win32'})
        Object.defineProperties(navigator, 'productSub', {get : () => '20100101'})
        Object.defineProperties(navigator, 'vendor', {get : () => 'win32'})
        Object.defineProperties(navigator, 'oscpu', {get : () => 'Windows NT 10.0; Win64; x64'})
    })
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:73.0) Gecko/20100101 Firefox/73.0')

    await page.goto('https://www.imdb.com/title/tt1190634/')

    // const html = await page.content()
    // await page.screenshot({path : 'screenshots/theboys.png', fullPage : true}) / can use page.pdf too

    const movie = await page.evaluate(() => {
        return {
            title : document.querySelector('h1 span').textContent,
            genres : Array.from(document.querySelectorAll('.ipc-chip-list__scroller .ipc-chip__text')).map(node => node.textContent),
            plot : document.querySelector('span[data-testid="plot-xl"]').textContent,
            // storyline : document.querySelector('section[data-testid="Storyline"]').innerHTML,
        }

    })
    console.log(JSON.stringify(movie))

    await browser.close()
}

run()