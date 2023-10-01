const puppeeter = require('puppeteer')

async function run (){
    const browser = await puppeeter.launch()
    const page = await browser.newPage()
    await page.evaluateOnNewDocument(() => {
        Object.defineProperties(navigator, 'platform', {get : () => 'win32'})
        Object.defineProperties(navigator, 'productSub', {get : () => '20100101'})
        Object.defineProperties(navigator, 'vendor', {get : () => 'win32'})
        Object.defineProperties(navigator, 'oscpu', {get : () => 'Windows NT 10.0; Win64; x64'})
    })
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:73.0) Gecko/20100101 Firefox/73.0')
    await page.goto('https://www.imdb.com/title/tt1190634/')

    await page.screenshot({path : 'screenshots/theboys.png'})

    await browser.close()
}

run()