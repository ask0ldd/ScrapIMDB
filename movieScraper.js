module.exports = 

class MovieScraper {

    static getTitle(){
        return document.querySelector('h1 span')?.textContent || ""
    }

    static getTest(){
        return 5
    }
}

/*const movieScraper = {
    getTitle : () => { return document.querySelector('h1 span')?.textContent },
    getPoster : () => document.querySelector('div[data-testid="hero-media__poster"] img')?.src || '',
    getGenres : () => Array.from(document.querySelectorAll('.ipc-chip-list__scroller .ipc-chip__text'), node => node.textContent) || [],
    test : 5,
}*/