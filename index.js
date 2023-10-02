const puppeeter = require('puppeteer')

async function run (){
    const browser = await puppeeter.launch()
    const page = await browser.newPage()
    page.setViewport({ width: 1440, height: 926 })
    
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
    // scroll to make the storyline text appear
    await page.evaluate('window.scrollTo(0, 8000)')
    await page.waitForFunction(`document.body.scrollHeight > 7000`)
    await page.waitForTimeout(2000)
    // await page.screenshot({path : 'screenshots/theboys.png', fullPage : true}) // can use page.pdf too

    const movie = await page.evaluate(() => {
        return {
            title : document.querySelector('h1 span')?.textContent || "",
            poster : document.querySelector('div[data-testid="hero-media__poster"] img')?.src || '',
            genres : Array.from(document.querySelectorAll('.ipc-chip-list__scroller .ipc-chip__text'), node => node.textContent) || [],
            rating : document.querySelector('div[data-testid="hero-rating-bar__aggregate-rating__score"] span')?.textContent || '',
            plot : document.querySelector('span[data-testid="plot-xl"]')?.textContent || '',
            episodes : document.querySelector('section[data-testid="Episodes"] h3.ipc-title__text span')?.textContent === 'Episodes' ? document.querySelector('h3.ipc-title__text span').nextElementSibling.textContent : '',
            storyline : document.querySelector('section[data-testid="Storyline"] .ipc-html-content-inner-div')?.textContent || '',
            creator :  document.querySelector('li[data-testid="title-pc-principal-credit"] ul li a')?.textContent || '',
            castLink : document.querySelector('a[aria-label="See full cast and crew"]')?.href || '',
            photos : Array.from(document.querySelectorAll('section[data-testid="Photos"] div[data-testid="shoveler-items-container"] .ipc-image'), node => ({url : node.src, alt : node.alt})) || [], // needs a href too
            relatedContent : Array.from(document.querySelectorAll('section[data-testid="MoreLikeThis"] div[data-testid="shoveler-items-container"]>div'), node => 
                ({
                    title: node.querySelector('span[data-testid="title"]')?.textContent || '', 
                    poster: node.querySelector('img.ipc-image')?.src || '',
                    rating: node.querySelector('span.ipc-rating-star')?.textContent || '',
                    urlMovie: node.querySelector('a')?.href || '',
                    // needs a href too
                })
            ) || [], 
            userReviewsPage : document.querySelector('section[data-testid="UserReviews"] a.ipc-title-link-wrapper')?.href || '',
            episodesPage : document.querySelector('section[data-testid="Episodes"] a')?.href || ''
        }
    })

    await page.goto(movie.castLink)
    await page.evaluate('window.scrollTo(0, 2000)')
    await page.waitForFunction(`document.body.scrollHeight > 1800`)
    await page.waitForTimeout(2000)

    const castWithParasiticNulls = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('table.cast_list .odd, table.cast_list .even'), rowNode => {
            if(rowNode.querySelectorAll('td')[1]?.querySelector('a')?.textContent!=null) {
                const allTD = rowNode.querySelectorAll('td')
                return { 
                    name : allTD[1]?.querySelector('a')?.textContent?.replace('\n', '') || '',
                    personalPage : allTD[1]?.querySelector('a')?.href || '',
                    portrait : allTD[0]?.querySelector('img').src || '',
                    character : allTD[3]?.querySelector('a')?.textContent?.replace('\n', '') || '',
                    episodes : allTD[3]?.querySelector('.toggle-episodes')?.textContent?.replace('\n', '')?.trimEnd() || ''
                }
            }
        })
    })

    let correctedIndex = 0
    const top20cast = castWithParasiticNulls.filter((el) => { 
            if(el != null && correctedIndex < 20 ) {
                correctedIndex++
                return el
            }
        }
    )

    // await page.screenshot({path : 'screenshots/theboys2.png', fullPage : true})

    await page.goto(movie.episodesPage)
    await page.evaluate('window.scrollTo(0, 2000)')
    await page.waitForFunction(`document.body.scrollHeight > 1800`)
    await page.waitForTimeout(2000)

    // await page.screenshot({path : 'screenshots/theboys3.png', fullPage : true})

    const season1 = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('article.episode-item-wrapper'), rowNode => (
            {
                pic : rowNode.querySelector('img')?.src || '',
                episode : rowNode.querySelector('h4 a')?.textContent.split(' ∙ ')[0] || '',
                title : rowNode.querySelector('h4 a')?.textContent.split(' ∙ ')[1] || '',
                date : rowNode.querySelector('h4')?.nextElementSibling?.textContent || '',
                plot : rowNode.querySelector('div.ipc-html-content-inner-div')?.textContent || '',
                rating : rowNode.querySelector("svg.ipc-icon--star-inline")?.parentElement?.textContent || '',
            }
        )
        )
    })

    // console.log(JSON.stringify(movie))
    console.log(JSON.stringify(season1))
    // console.log(JSON.stringify(top20cast))
    // console.log(movie.storyline)

    await browser.close()
}

run()