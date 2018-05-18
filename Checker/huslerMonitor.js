// @ts-check
const delay = require('./delay').delay;
const fetch = require('node-fetch').default;

const checkDelay = 50;

const hustleRegExp = /\b(hustle[srd]?|hustling?)\b/i

const isHustle = item => {
    if (item.type !== 'story' && item.type !== 'comment') {
        return false;
    }
    if (item.text && item.text.match(hustleRegExp)) {
        return true;
    }
    if (item.title && item.title.match(hustleRegExp)) {
        return true;
    }
    return false
};

module.exports.getMoreRecentHustle = async function getMoreRecentHustle(lastTime, maxId) {
    const result = await fetch('https://hacker-news.firebaseio.com/v0/updates.json?print=pretty');
    if (!result.ok) {
        console.error('Error getting updates')
        return;
    }

    const json = await result.json();

    for (const itemId of json.items.sort().reverse()) {
        if (itemId <= maxId) {
            break;
        }

        const result2 = await fetch(`https://hacker-news.firebaseio.com/v0/item/${itemId}.json`);
        if (!result2.ok) {
            continue;
        }

        const item = await result2.json();
        if (!item.time) {
            return;
        }

        const time = item.time * 1000;
        // Try skipping edits
        if (time < lastTime) {
            continue;
        }

        if (isHustle(item)) {
            console.log("Keep on hustlin'")
            return item;
        }

        delay(checkDelay);
    }
};
