const puppeeter = require('puppeteer')
const fs = require('fs')
const MovieScraper = require('./movieScraper.js')

async function getMediaDatas(mediaUrl, maxPics, maxCastMembers){

}

async function run (){

    const browser = await puppeeter.launch()
    const page = await browser.newPage()
    page.setViewport({ width: 1440, height: 926 })
    
    // fake user agent definition
    await page.evaluateOnNewDocument(() => {
        Object.defineProperties(navigator, 'platform', {get : () => 'win32'})
        Object.defineProperties(navigator, 'productSub', {get : () => '20100101'})
        Object.defineProperties(navigator, 'vendor', {get : () => 'win32'})
        Object.defineProperties(navigator, 'oscpu', {get : () => 'Windows NT 10.0; Win64; x64'})
    })
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:73.0) Gecko/20100101 Firefox/73.0')

    const tvshowUrl = 'https://www.imdb.com/title/tt1190634/'
    // const tvshowUrl = 'https://www.imdb.com/title/tt0137523/'
    await page.goto(tvshowUrl)

    // scrolls to make the storyline text appear
    await page.evaluate('window.scrollTo(0, 8000)')
    await page.waitForFunction(`document.body.scrollHeight > 7000`)
    await page.waitForTimeout(3000)

    // await page.screenshot({path : 'screenshots/theboys.png', fullPage : true}) // can use page.pdf too
    // retrieves all the mains datas from the movie page
    const movie = await page.evaluate(() => {
        const [mediaType, releaseDate, contentRating, duration] = Array.from(document.querySelector('h1')?.nextElementSibling?.querySelectorAll('li'), li => {
            return li.querySelector('a') == null ? li.textContent : li.querySelector('a')?.textContent
        })

        return {
            title : document.querySelector('h1 span')?.textContent || "",
            mediaType,
            releaseDate,
            contentRating,
            duration,
            poster : document.querySelector('div[data-testid="hero-media__poster"] img')?.src || '',
            genres : Array.from(document.querySelectorAll('.ipc-chip-list__scroller .ipc-chip__text'), node => node.textContent) || [],
            rating : document.querySelector('div[data-testid="hero-rating-bar__aggregate-rating__score"] span')?.textContent || '',
            plot : document.querySelector('span[data-testid="plot-xl"]')?.textContent || '',
            episodes : document.querySelector('section[data-testid="Episodes"] h3.ipc-title__text span')?.textContent === 'Episodes' ? document.querySelector('h3.ipc-title__text span').nextElementSibling.textContent : '',
            storyline : document.querySelector('section[data-testid="Storyline"] .ipc-html-content-inner-div')?.textContent || '',
            creator :  document.querySelector('li[data-testid="title-pc-principal-credit"] ul li a')?.textContent || '',
            castListPage : document.querySelector('a[aria-label="See full cast and crew"]')?.href || '',
            photos : Array.from(document.querySelectorAll('section[data-testid="Photos"] div[data-testid="shoveler-items-container"] .ipc-image'), node => 
            ({
                miniatureUrl : node?.src || '',
                id : node?.src.split('/')[5].split('.')[0], 
                alt : node?.alt || '',
                mediaViewerPage : node.parentElement?.nextSibling?.href || '',
            })
            ) || [],
            relatedContent : Array.from(document.querySelectorAll('section[data-testid="MoreLikeThis"] div[data-testid="shoveler-items-container"]>div'), node => 
                ({
                    title: node.querySelector('span[data-testid="title"]')?.textContent || '', 
                    poster: node.querySelector('img.ipc-image')?.src || '',
                    rating: node.querySelector('span.ipc-rating-star')?.textContent || '',
                    contentPage: node.querySelector('a')?.href || '',
                })
            ) || [], 
            userReviewsPage : document.querySelector('section[data-testid="UserReviews"] a.ipc-title-link-wrapper')?.href || '',
            episodesPage : document.querySelector('section[data-testid="Episodes"] a')?.href || ''
        }
    })

    await page.goto(movie.castListPage)
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

    await page.goto(movie.episodesPage)
    await page.evaluate('window.scrollTo(0, 2000)')
    await page.waitForFunction(`document.body.scrollHeight > 1800`)
    await page.waitForTimeout(2000)

    // retrieves season 1 and the number of seasons broadcasted or announced by the channel
    const { seasons, nSeasons } = await page.evaluate(() => {
        return { 
            seasons : [ Array.from(document.querySelectorAll('article.episode-item-wrapper'), rowNode => (
            {
                pic : rowNode.querySelector('img')?.src || '',
                episode : rowNode.querySelector('h4 a')?.textContent.split(' ∙ ')[0] || '',
                title : rowNode.querySelector('h4 a')?.textContent.split(' ∙ ')[1] || '',
                date : rowNode.querySelector('h4')?.nextElementSibling?.textContent || '',
                plot : rowNode.querySelector('div.ipc-html-content-inner-div')?.textContent || '',
                rating : rowNode.querySelector("svg.ipc-icon--star-inline")?.parentElement?.textContent || '',
            })) ],
            nSeasons : Array.from(document.querySelectorAll('li[data-testid="tab-season-entry"]')).length,
        }
    })

    // if more than one seasons, retrieves datas for the subsequent ones
    if(nSeasons > 1)
    for(let i = 2; i<=nSeasons; i++){
        await page.goto(tvshowUrl + 'episodes/?season='+i)
        await page.waitForTimeout(2000)
        seasons.push(
            await page.evaluate(() => (
                Array.from(document.querySelectorAll('article.episode-item-wrapper'), rowNode => (
                    {
                        pic : rowNode.querySelector('img')?.src || '',
                        episode : rowNode.querySelector('h4 a')?.textContent.split(' ∙ ')[0] || '',
                        title : rowNode.querySelector('h4 a')?.textContent.split(' ∙ ')[1] || '',
                        date : rowNode.querySelector('h4')?.nextElementSibling?.textContent || '',
                        plot : rowNode.querySelector('div.ipc-html-content-inner-div')?.textContent || '',
                        rating : rowNode.querySelector("svg.ipc-icon--star-inline")?.parentElement?.textContent || '',
                    }))
            ))
        )
    }

    // gets rid of last season if not broadcasted yet
    if(seasons[seasons.length-1][0].plot === "") seasons.pop()

    // go to the gallery page
    await page.goto(tvshowUrl + 'mediaviewer/')
    await page.waitForTimeout(2000)
    /*page.click('div[aria-label="Next"]')
    await page.waitForTimeout(2000)*/

    // circles through the gallery to get the datas about the first 12 pics
    for(let i=0; i<12; i++){

        // const imgSrc = i === 0 ? await page.evaluate(() => document.querySelectorAll('div[data-testid="media-viewer"] img')[0]?.srcset) : await page.evaluate(() => document.querySelectorAll('div[data-testid="media-viewer"] img')[1]?.srcset)
        /*const imgs = await page.evaluate(() => document.querySelectorAll('div[data-testid="media-viewer"] img'))
        let imgSrc
        console.log(imgs)
        for(const imgTemp in imgs){
            // find the image containing curr in it's data-image-id
            if(imgTemp.getAttribute('data-image-id').includes("curr")) imgSrc = imgTemp.srcset
        }*/

        const imgSrc = await page.evaluate(() => {
            let imgSrc
            document.querySelectorAll('div[data-testid="media-viewer"] img').forEach(img=> {
                if(img.getAttribute('data-image-id').includes("curr")) imgSrc = img.srcset
            })
            return imgSrc
        })

        const actors = await page.evaluate(()=> (
            Array.from(document.querySelectorAll('div[data-testid="media-sheet"] div.ipc-html-content-inner-div a'), element => (element.innerHTML))
        ))

        // last element is the name of the media and not some actors name
        actors.pop()
        
        // converts the srcset string into an array
        const urlnWidth = imgSrc.split(', ')
        const fullPics = Array.from(urlnWidth, el => {
            const [url, width] = el.split(' ')
            return {url, width : width.slice(0, -1)}
        })

        movie.photos[i] = {...movie.photos[i], fullPics : fullPics, actors : actors}
        page.click('div[aria-label="Next"]')
        await page.waitForTimeout(1000)
    }

    // review page
    await page.goto(movie.userReviewsPage)
    await page.evaluate('window.scrollTo(0, 8000)')
    await page.waitForFunction(`document.body.scrollHeight > 7000`)
    await page.waitForTimeout(3000)

    const reviews = await page.evaluate(() => Array.from(document.querySelectorAll('.review-container'), reviewContainer => {
            return {
                title : reviewContainer.querySelector('a.title')?.textContent?.trim() || '',
                rating : reviewContainer.querySelector('span.point-scale')?.previousElementSibling?.textContent || '',
                review : reviewContainer.querySelector('div.content div')?.textContent || '',
                user : reviewContainer.querySelector('span.display-name-link a')?.textContent || '',
                date : reviewContainer.querySelector('span.review-date')?.textContent || '',
            }
        })
    )

    // writes the movies datas as a formatted json file
    fs.writeFile('theboys.json', JSON.stringify({ movie, cast : top20cast, seasons, reviews : reviews.slice(0, 9) }, null, 4), err => { if (err) { console.error(err) } });

    await browser.close()
}

run()

// console.log(JSON.stringify(movie))
// console.log(JSON.stringify(seasons))
// console.log(JSON.stringify(nSeasons))
// console.log(JSON.stringify(top20cast))
// console.log(movie.storyline)