const standedPack = require("./packs/standeredPack.json");
const allCards = require("./packs/allCards.json");
const shinyPacks = require("./packs/shinyPacks.json");
const seriesTitleData = require("./data/seriesTitleData.json");
const fullSeriesTitleData = require("./data/fullSeriesTitleData.json");
const { currency, UserTitles, TitleDatabase } = require("./dbObjects.js");
const Canvas = require('@napi-rs/canvas');
const { getImage } = require("./imageObjects.js");
const { getCurrentStatsSeperate } = require("./affectionObjects.js");

function getSeries(series, starArray) {
    let seriesPack = "";
    
    if (series == "random") {
        const randomPack = Math.floor(Math.random() * Object.keys(starArray).length);
        
        for (let i = 0; i < Object.keys(starArray).length; i++) {
            if (i == randomPack) {
                seriesPack = Object.keys(starArray)[i];
            }
        }
    }
    else{ 
        seriesPack = series;
        
    }

    return seriesPack;
}

function checkForShiny(seriesPack) {
    const shinyChance = Math.floor(Math.random() * (101 - 1) + 1);
    if (shinyChance <= 1) {
        const shinyPack = shinyPacks[seriesPack];

        if (shinyPack) return shinyPack;
    }

    return seriesPack;
}

function getWhichStar(series, boost=0) {

    // Make random number between 1 and 4
    const random = Math.min(Math.floor(Math.random() * (101 - 1) + 1) + boost, 100);

    // check what star that is
    if (random <= 60) { // 60 % chance
        let seriesPack = getSeries(series, standedPack["common"])
        const pokemon = pullRandomCard(standedPack["common"][seriesPack]);
        seriesPack = checkForShiny(seriesPack);
        return allCards[seriesPack][pokemon];
    }
    else if (random > 60 && random <= 85) { // 25% chance
        let seriesPack = getSeries(series, standedPack["uncommon"])
        const pokemon = pullRandomCard(standedPack["uncommon"][seriesPack]);
        seriesPack = checkForShiny(seriesPack);
        return allCards[seriesPack][pokemon];
    }
    else if (random > 85 && random <= 95) { // 10% chance 
        let seriesPack = getSeries(series, standedPack["rare"])
        const pokemon = pullRandomCard(standedPack["rare"][seriesPack]);
        seriesPack = checkForShiny(seriesPack);
        return allCards[seriesPack][pokemon];
    }
    else if (random > 95 && random <= 99) { // 5% chance
        let seriesPack = getSeries(series, standedPack["srare"])
        const pokemon = pullRandomCard(standedPack["srare"][seriesPack]);
        seriesPack = checkForShiny(seriesPack);
        return allCards[seriesPack][pokemon];
    }
    else if (random > 99 && random <= 100) { // 1% chance
        let seriesPack = getSeries(series, standedPack["urare"])
        const pokemon = pullRandomCard(standedPack["urare"][seriesPack]);
        seriesPack = checkForShiny(seriesPack);
        return allCards[seriesPack][pokemon];
    }
}

function pullRandomCard(starArray) {

    // Make a random number base on the amount of pokemon in a list
    var randomNum = Math.round(Math.random() * Object.keys(starArray).length) - 1;

    if (randomNum >= starArray.length) {
        randomNum = starArray.length - 1;
    }
    if (randomNum < 0) {
        randomNum = 0;
    }

    var i = 0;
    for(const poke of starArray) {
        if (i == randomNum) {
            return poke;
            
        }
        i++;
    }
    
}

async function makePokeImageData(pokemonData, cardData, context, x, y) {

    cardData.item = pokemonData;
    
    const bottom = await Canvas.loadImage(`./pokeImages/pokemon/${pokemonData.series}/${pokemonData.name}/Bottom.png`);
    // const bottom = getImage("pokemon-bottom", cardData, "DATA");

    let frame;
    if (pokemonData.poke_type == "BASIC") {
        if (pokemonData.card_type == "FRAME" || pokemonData.card_type == "HOLOFRAME") frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData.series}/${pokemonData.type}/Full-Frame.png`)
        else frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData.series}/${pokemonData.type}/Normal-Frame.png`);
    }
    else if (pokemonData.poke_type == "STAGE 1") {
        if (pokemonData.card_type == "FRAME" || pokemonData.card_type == "HOLOFRAME") frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData.series}/${pokemonData.type}/FullStage1-Frame.png`)
        else frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData.series}/${pokemonData.type}/Stage1-Frame.png`);
    }
    else if (pokemonData.poke_type == "STAGE 2") {
        if (pokemonData.card_type == "FRAME" || pokemonData.card_type == "HOLOFRAME") frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData.series}/${pokemonData.type}/FullStage2-Frame.png`);
        else frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData.series}/${pokemonData.type}/Stage2-Frame.png`);
    }
    // const frame = getImage("frames", cardData, "DATA");

    const hp = await Canvas.loadImage(`./pokeImages/health/${getCurrentStatsSeperate(pokemonData, cardData)["HP"]}.png`);
    const top = await Canvas.loadImage(`./pokeImages/pokemon/${pokemonData.series}/${pokemonData.name}/Top-${pokemonData.card_type}.png`);
    // const hp = getImage("health", cardData, "DATA");
    // const top = getImage("pokemon-top", cardData, "DATA");

    // const moves = await Canvas.loadImage(`./pokeImages/moves/${pokemonData.series}/${pokemonData.poke_type}/${pokemonData.type}/${pokemonData.card_type}.png`);

    let  affection = await Canvas.loadImage(`./pokeImages/affection/level0.png`);
    
    if (cardData.level >= 5 && cardData.level < 10) {
        affection = await Canvas.loadImage(`./pokeImages/affection/level5.png`);
    }
    else if (cardData.level >= 10) {
        affection = await Canvas.loadImage(`./pokeImages/affection/level10.png`);
    }
    const holoEffect = await Canvas.loadImage(`./pokeImages/effects/HOLO.png`);
    // const affection = getImage("affection", cardData, "DATA");
    // const holoEffect = getImage("effects", "HOLO.png", "DATA");

    context.drawImage(bottom, x, y, bottom.width, bottom.height);
    context.drawImage(frame, x, y, bottom.width, bottom.height);
    context.drawImage(hp, x, y, bottom.width, bottom.height);
    context.drawImage(top, x, y, bottom.width, bottom.height);
    // context.drawImage(moves, x, y, bottom.width, bottom.height);
    context.drawImage(affection, x, y, bottom.width, bottom.height);

    if (pokemonData.card_type == "HOLO" || pokemonData.card_type == "HOLOFRAME") {
        context.globalCompositeOperation = "multiply";
        context.drawImage(holoEffect, x, y, bottom.width, bottom.height);
        context.globalCompositeOperation = "source-over";
    }

    return context;
}

async function makePokeImageDataNoAffection(pokemonData, context, x, y) {
    // const cardData = new Object;
    // cardData.level = 0;
    // cardData.item = pokemonData;
    const bottom = await Canvas.loadImage(`./pokeImages/pokemon/${pokemonData.series}/${pokemonData.name}/Bottom.png`);

    // const bottom = getImage("pokemon-bottom", cardData, "DATA");

    let frame;
    if (pokemonData.poke_type == "BASIC") {
        if (pokemonData.card_type == "FRAME" || pokemonData.card_type == "HOLOFRAME") frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData.series}/${pokemonData.type}/Full-Frame.png`)
        else frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData.series}/${pokemonData.type}/Normal-Frame.png`);
    }
    else if (pokemonData.poke_type == "STAGE 1") {
        if (pokemonData.card_type == "FRAME" || pokemonData.card_type == "HOLOFRAME") frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData.series}/${pokemonData.type}/FullStage1-Frame.png`)
        else frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData.series}/${pokemonData.type}/Stage1-Frame.png`);
    }
    else if (pokemonData.poke_type == "STAGE 2") {
        if (pokemonData.card_type == "FRAME" || pokemonData.card_type == "HOLOFRAME") frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData.series}/${pokemonData.type}/FullStage2-Frame.png`);
        else frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData.series}/${pokemonData.type}/Stage2-Frame.png`);
    }
    // const frame = getImage("frames", cardData, "DATA");

    const hp = await Canvas.loadImage(`./pokeImages/health/20.png`);
    const top = await Canvas.loadImage(`./pokeImages/pokemon/${pokemonData.series}/${pokemonData.name}/Top-${pokemonData.card_type}.png`);
    // const hp = getImage("health", cardData, "DATA");
    // const top = getImage("pokemon-top", cardData, "DATA");

    // const moves = await Canvas.loadImage(`./pokeImages/moves/${pokemonData.series}/${pokemonData.poke_type}/${pokemonData.type}/${pokemonData.card_type}.png`)

    const holoEffect = await Canvas.loadImage(`./pokeImages/effects/HOLO.png`);
    // const holoEffect = getImage("effects", "HOLO.png", "DATA");

    context.drawImage(bottom, x, y, bottom.width, bottom.height);
    context.drawImage(frame, x, y, bottom.width, bottom.height);
    context.drawImage(hp, x, y, bottom.width, bottom.height);
    context.drawImage(top, x, y, bottom.width, bottom.height);
    // context.drawImage(moves, x, y, bottom.width, bottom.height);

    if (pokemonData.card_type == "HOLO" || pokemonData.card_type == "HOLOFRAME") {
        context.globalCompositeOperation = "multiply";
        context.drawImage(holoEffect, x, y, bottom.width, bottom.height);
        context.globalCompositeOperation = "source-over";
    }

    return context;
}

async function makePokeImage(pokemonData, cardData) {
    const canvas = Canvas.createCanvas(745, 1040);
    let context = canvas.getContext('2d');

    if (!cardData) context = await makePokeImageDataNoAffection(pokemonData, context, 0, 0);
    else context = await makePokeImageData(pokemonData, cardData, context, 0, 0);

    return canvas.encode('png');
}

async function makePokeImageDict(pokemonData, context, x, y) {

    // const affection = getImage("affection", pokemonData, "DICT");
    // const holoEffect = getImage("effects", "HOLO.png", "DICT");
    const affection = await Canvas.loadImage(`./pokeImages/affection/level0.png`);
    const holoEffect = await Canvas.loadImage(`./pokeImages/effects/HOLO.png`);

    // let bottom = getImage("pokemon-bottom", pokemonData, "DICT");
    // let frame = getImage("frames", pokemonData, "DICT");
    // let hp = getImage("health", pokemonData, "DICT");
    // let top = getImage("pokemon-top", pokemonData, "DICT");
    let bottom = await Canvas.loadImage(`./pokeImages/pokemon/${pokemonData["Series"]}/${pokemonData["Name"]}/Bottom.png`);
    let frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData["Series"]}/${pokemonData["Type"]}/Normal-Frame.png`);
    let hp = await Canvas.loadImage(`./pokeImages/health/20.png`);
    let top = await Canvas.loadImage(`./pokeImages/pokemon/${pokemonData["Series"]}/${pokemonData["Name"]}/Top-${pokemonData["CardType"]}.png`);

    // const moves = await Canvas.loadImage(`./pokeImages/moves/${pokemonData["Series"]}/${pokemonData["PokeType"]}/${pokemonData["Type"]}/${pokemonData["CardType"]}.png`)

    if (pokemonData["PokeType"] == "BASIC") {
        if (pokemonData["CardType"] == "FRAME" || pokemonData["CardType"] == "HOLOFRAME") frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData["Series"]}/${pokemonData["Type"]}/Full-Frame.png`);
        else frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData["Series"]}/${pokemonData["Type"]}/Normal-Frame.png`);
    }
    else if (pokemonData["PokeType"] == "STAGE 1") {
        if (pokemonData["CardType"] == "FRAME" || pokemonData["CardType"] == "HOLOFRAME") frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData["Series"]}/${pokemonData["Type"]}/FullStage1-Frame.png`);
        else frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData["Series"]}/${pokemonData["Type"]}/Stage1-Frame.png`);
    }
    else if (pokemonData["PokeType"] == "STAGE 2") {
        if (pokemonData["CardType"] == "FRAME" || pokemonData["CardType"] == "HOLOFRAME") frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData["Series"]}/${pokemonData["Type"]}/FullStage2-Frame.png`);
        else frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData["Series"]}/${pokemonData["Type"]}/Stage2-Frame.png`);
    }

    context.drawImage(bottom, x, y, bottom.width, bottom.height);

    context.drawImage(frame, x, y, bottom.width, bottom.height);
    context.drawImage(hp, x, y, bottom.width, bottom.height);
    context.drawImage(top, x, y, bottom.width, bottom.height);
    // context.drawImage(moves, x, y, bottom.width, bottom.height);
    context.drawImage(affection, x, y, bottom.width, bottom.height);
    
    if (pokemonData["CardType"] == "HOLO" || pokemonData["CardType"] == "HOLOFRAME") {
        context.globalCompositeOperation = "multiply";
        context.drawImage(holoEffect, x, y, bottom.width, bottom.height);
        context.globalCompositeOperation = "source-over";
    }

    return context;
}

async function makePokeImagePull(pokemonData1, pokemonData2) {
    const canvas = Canvas.createCanvas(1640, 1240);
    let context = canvas.getContext('2d');

    context = await makePokeImageDict(pokemonData1, context, 50, 100);
    context = await makePokeImageDict(pokemonData2, context, 845, 100);

    return canvas.encode('png');
}

async function makePokeImageTrade(pokemonData1, cardData1, pokemonData2, cardData2) {
    const canvas = Canvas.createCanvas(1990, 1240);
    let context = canvas.getContext('2d');

    context = await makePokeImageData(pokemonData1, cardData1, context, 50, 100);

    const trade = await Canvas.loadImage(`./resources/trade.png`);
    context.drawImage(trade, 795, 420, 400, 400);

    context = await makePokeImageData(pokemonData2, cardData2, context, 1195, 100);

    return canvas.encode('png');
}

async function makePokeImageDraw3(pokemonDataList) {
    let canvasList = []

    const cardBack = await Canvas.loadImage(`./pokeImages/CardBack.png`);
    // const cardBack = getImage("CardBack.png", null, "DICT");

    for (let i = 0; i < 4; i++) {
        const canvas = Canvas.createCanvas(2435, 1240);
        let context = canvas.getContext('2d');
        
        context = await makePokeImageDict(pokemonDataList[0], context, 50, 100);
        if (i == 0) {
            context.drawImage(cardBack, 50, 100);
        }

        context = await makePokeImageDict(pokemonDataList[1], context, 845, 100);
        if (i <= 1) {
            context.drawImage(cardBack, 845, 100);
        }

        context = await makePokeImageDict(pokemonDataList[2], context, 1640, 100);
        if (i <= 2) {
            context.drawImage(cardBack, 1640, 100);
        }

        canvasList.push(canvas.encode('png'))
    }

    return canvasList;
}

async function makePokeImageDraw5(pokemonDataList) {
    let canvasList = []

    const cardBack = await Canvas.loadImage(`./pokeImages/CardBack.png`);
    // const cardBack = getImage("CardBack.png", null, "DICT");

    for (let i = 0; i < 6; i++) {
        const canvas = Canvas.createCanvas(4025, 1240);
        let context = canvas.getContext('2d');
        
        context = await makePokeImageDict(pokemonDataList[0], context, 50, 100);
        if (i == 0) {
            context.drawImage(cardBack, 50, 100);
        }

        context = await makePokeImageDict(pokemonDataList[1], context, 845, 100);
        if (i <= 1) {
            context.drawImage(cardBack, 845, 100);
        }

        context = await makePokeImageDict(pokemonDataList[2], context, 1640, 100);
        if (i <= 2) {
            context.drawImage(cardBack, 1640, 100);
        }

        context = await makePokeImageDict(pokemonDataList[3], context, 1690, 100);
        if (i <= 3) {
            context.drawImage(cardBack, 1690, 100);
        }

        context = await makePokeImageDict(pokemonDataList[4], context, 2485, 100);
        if (i <= 4) {
            context.drawImage(cardBack, 2485, 100);
        }

        canvasList.push(canvas.encode('png'))
    }

    return canvasList;
}

async function addBalance(id, amount) {
	
	const user = currency.get(id);

	if (user) {
		user.balance += Number(amount);
		return user.save();
	}
}

function raritySymbol(pokeRarity) {

    let rarity;
    if(pokeRarity == "Common" ) rarity = "●";
    else if(pokeRarity == "Uncommon" ) rarity = "◆";
    else if(pokeRarity == "Rare" ) rarity = "★";

    return rarity
}

function formatName(pokemonData) {
    if (pokemonData.card_type == "HOLO") return `\\*${pokemonData.card_id}-${pokemonData.name}\\*`;
    else if (pokemonData.card_type == "FRAME") return `[${pokemonData.card_id}-${pokemonData.name}]`;
    else if (pokemonData.card_type == "HOLOFRAME") return `{${pokemonData.card_id}-${pokemonData.name}}`;
    else return `${pokemonData.card_id}-${pokemonData.name}`;
}

function formatNameSmall(pokemonData) {
    if (pokemonData.card_type == "HOLO") return `\\*${pokemonData.name}\\*`;
    else if (pokemonData.card_type == "FRAME") return `[${pokemonData.name}]`;
    else if (pokemonData.card_type == "HOLOFRAME") return `{${pokemonData.name}}`;
    else return `${pokemonData.card_id}-${pokemonData.name}`;
}

async function checkShinyGrab(message) {

    const titleData = await TitleDatabase.findOne({ where: { name: "Sparkly Garbage" } });

    if (!titleData) { return; }

    const userTitle = await UserTitles.findOne({ where: { user_id: message.author.id, title_id: titleData.id } });
    
    if (userTitle) { return; }

    await UserTitles.create({ user_id: message.author.id, title_id: titleData.id });

    await message.channel.send(`${message.author}, you have grabbed your first **SHINY**. You have gained the title: \`${titleData.name}\``);
}

async function checkSeriesCollect(userCards, series, message, userMention=null) {
    if (!userMention) { userMention = message.author; }
    let seriesDict = {};
    let fullSeriesDict = {
        "BASIC": {},
        "HOLO": {},
        "FRAME": {},
        "HOLOFRAME": {}
    };

    for (card of Object.keys(allCards[series])) {
        fullSeriesDict[allCards[series][card]["CardType"]][allCards[series][card]["Name"]] = false;
        if (card[0] == '*' || card[0] == '[' || card[0] == '{') continue;

        seriesDict[card] = false;
        
    }
    
    for (uCard of userCards) {
        if (uCard.item.series == series) {
            seriesDict[uCard.item.name] = true;
            fullSeriesDict[uCard.item.card_type][uCard.item.name] = true;
        }
        
    }

    let has = 0;

    for ([card, have] of Object.entries(seriesDict)) {
        if (have) {
            has++;
        }
    }

    let fullHas = 0;
    for (cardType of Object.keys(fullSeriesDict)) {
        for ([card, have] of Object.entries(fullSeriesDict[cardType])) {
            if (have) {
                fullHas++;
            }
        }
    }

    if (fullHas == 50) {
        
        await _fullHasHandle(series, userMention, message);
    }

    if (has == Object.keys(seriesDict).length) {
        
        await _hasHandle(series, userMention, message);
    }
}

async function _hasHandle(series, userMention, message) {
    const titleSeriesName = seriesTitleData[series];

    if (!titleSeriesName) { return; }

    const titleData = await TitleDatabase.findOne({ where: { name: titleSeriesName } });

    if (!titleData) { return; }

    const userTitle = await UserTitles.findOne({ where: { user_id: userMention.id, title_id: titleData.id } });
    
    if (userTitle) { return; }

    await UserTitles.create({ user_id: userMention.id, title_id: titleData.id });

    await message.channel.send(`${userMention}, you have collected all cards in the \`${series} Pack\`. You have gained the title: \`${titleData.name}\``);
}

async function _fullHasHandle(series, userMention, message) {
    const titleSeriesName = fullSeriesTitleData[series];

    if (!titleSeriesName) { return; }

    const titleData = await TitleDatabase.findOne({ where: { name: titleSeriesName } });

    if (!titleData) { return; }

    const userTitle = await UserTitles.findOne({ where: { user_id: userMention.id, title_id: titleData.id } });
    
    if (userTitle) { return; }

    await UserTitles.create({ user_id: userMention.id, title_id: titleData.id });

    await message.channel.send(`${userMention}, you have collected all cards in the \`${series} Pack\` and each card variant. You have gained the title: \`${titleData.name}\``);
}

async function createCardID(user){
    const lastID = user.last_code;

    let newCode = ""
    
    for (num of lastID.slice(2)) {
        let lookNum = num.charCodeAt(0);

        if (lookNum == 57) {
            if (newCode.length > 0) {
                let _ln = newCode[newCode.length - 1].charCodeAt(0);
                _ln++;
            
                if(lastID[newCode.length + 1] == "9"){
                    newCode = newCode.slice(0, newCode.length - 1) + "00";
                } else {
                    newCode = newCode.slice(0, newCode.length - 1) + String.fromCharCode(_ln) + "0";
                }
            }
        }
        else {
            if(newCode.length == 3) {
                lookNum++;
                newCode +=  String.fromCharCode(lookNum);
            }
            else {
                newCode += num;
            }
        }
    }

    newCode = lastID.slice(0, 2) + newCode;
    user.last_code = newCode;
    user.save();
    return newCode;

}

module.exports = { getWhichStar, makePokeImage, makePokeImagePull, makePokeImageDraw3, makePokeImageDraw5, makePokeImageTrade, addBalance, raritySymbol, formatName, formatNameSmall, checkSeriesCollect, createCardID, checkShinyGrab};