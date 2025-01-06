const standedPack = require("./packs/standeredPack.json");
const allCards = require("./packs/allCards.json");
const seriesTitleData = require("./data/seriesTitleData.json");
const { currency, UserTitles, TitleDatabase } = require("./dbObjects.js");
const Canvas = require('@napi-rs/canvas');
const { getCurrentStatsSeperate } = require("./affectionObjects.js");
const { messageLink } = require("discord.js");

function getSeries(series, starArray) {
    let seriesPack = {};
    
    if (series == "random") {
        const randomPack = Math.floor(Math.random() * Object.keys(starArray).length);
        
        for (let i = 0; i < Object.keys(starArray).length; i++) {
            if (i == randomPack) {
                seriesPack = Object.keys(starArray)[i];
            }
        }
    }

    return seriesPack;
}

function getWhichStar(series) {

    // Make random number between 1 and 4
    const random = Math.floor(Math.random() * 100) + 1;

    // check what star that is
    if (random <= 60) {
        const seriesPack = getSeries(series, standedPack["common"])
        const pokemon = pullRandomCard(standedPack["common"][seriesPack]);
        return allCards[seriesPack][pokemon];
    }
    else if (random > 60 && random <= 90) {
        const seriesPack = getSeries(series, standedPack["uncommon"])
        const pokemon = pullRandomCard(standedPack["uncommon"][seriesPack]);
        return allCards[seriesPack][pokemon];
    }
    else if (random > 90 && random <= 99) {
        const seriesPack = getSeries(series, standedPack["rare"])
        const pokemon = pullRandomCard(standedPack["rare"][seriesPack]);
        return allCards[seriesPack][pokemon];
    }
    else if (random > 99 && random <= 100) {
        const seriesPack = getSeries(series, standedPack["urare"])
        const pokemon = pullRandomCard(standedPack["urare"][seriesPack]);
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
    const bottom = await Canvas.loadImage(`./pokeImages/${pokemonData.series}/${pokemonData.name}/Bottom.png`);

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

    const hp = await Canvas.loadImage(`./pokeImages/health/${getCurrentStatsSeperate(pokemonData, cardData)["HP"]}.png`);
    const top = await Canvas.loadImage(`./pokeImages/${pokemonData.series}/${pokemonData.name}/Top-${pokemonData.card_type}.png`);

    // const moves = await Canvas.loadImage(`./pokeImages/moves/${pokemonData.series}/${pokemonData.poke_type}/${pokemonData.type}/${pokemonData.card_type}.png`);

    let  affection = await Canvas.loadImage(`./pokeImages/affection/level0.png`);
    
    if (cardData.level >= 5 && cardData.level < 10) {
        affection = await Canvas.loadImage(`./pokeImages/affection/level5.png`);
    }
    else if (cardData.level >= 10) {
        affection = await Canvas.loadImage(`./pokeImages/affection/level10.png`);
    }
    const holoEffect = await Canvas.loadImage(`./pokeImages/effects/HOLO.png`);

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
    const bottom = await Canvas.loadImage(`./pokeImages/${pokemonData.series}/${pokemonData.name}/Bottom.png`);

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

    const hp = await Canvas.loadImage(`./pokeImages/health/20.png`);
    const top = await Canvas.loadImage(`./pokeImages/${pokemonData.series}/${pokemonData.name}/Top-${pokemonData.card_type}.png`);

    // const moves = await Canvas.loadImage(`./pokeImages/moves/${pokemonData.series}/${pokemonData.poke_type}/${pokemonData.type}/${pokemonData.card_type}.png`)

    const holoEffect = await Canvas.loadImage(`./pokeImages/effects/HOLO.png`);

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
    const canvas = Canvas.createCanvas(1490, 2080);
    let context = canvas.getContext('2d');

    if (!cardData) context = await makePokeImageDataNoAffection(pokemonData, context, 0, 0);
    else context = await makePokeImageData(pokemonData, cardData, context, 0, 0);

    return canvas.encode('png');
}

async function makePokeImageDict(pokemonData, context, x, y) {

    const affection = await Canvas.loadImage(`./pokeImages/affection/level0.png`);
    const holoEffect = await Canvas.loadImage(`./pokeImages/effects/HOLO.png`);

    let bottom = await Canvas.loadImage(`./pokeImages/${pokemonData["Series"]}/${pokemonData["Name"]}/Bottom.png`);
    let frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData["Series"]}/${pokemonData["Type"]}/Normal-Frame.png`);
    let hp = await Canvas.loadImage(`./pokeImages/health/20.png`);
    let top = await Canvas.loadImage(`./pokeImages/${pokemonData["Series"]}/${pokemonData["Name"]}/Top-${pokemonData["CardType"]}.png`);

    // const moves = await Canvas.loadImage(`./pokeImages/moves/${pokemonData["Series"]}/${pokemonData["PokeType"]}/${pokemonData["Type"]}/${pokemonData["CardType"]}.png`)

    context.drawImage(bottom, x, y, bottom.width, bottom.height);
    
    if (pokemonData["PokeType"] == "BASIC") {
        if (pokemonData["CardType"] == "FRAME" || pokemonData["CardType"] == "HOLOFRAME") frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData["Series"]}/${pokemonData["Type"]}/Full-Frame.png`);
        frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData["Series"]}/${pokemonData["Type"]}/Normal-Frame.png`);
    }
    else if (pokemonData["PokeType"] == "STAGE 1") {
        if (pokemonData["CardType"] == "FRAME" || pokemonData["CardType"] == "HOLOFRAME") frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData["Series"]}/${pokemonData["Type"]}/FullStage1-Frame.png`);
        frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData["Series"]}/${pokemonData["Type"]}/Stage1-Frame.png`);
    }
    else if (pokemonData["PokeType"] == "STAGE 2") {
        if (pokemonData["CardType"] == "FRAME" || pokemonData["CardType"] == "HOLOFRAME") frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData["Series"]}/${pokemonData["Type"]}/FullStage2-Frame.png`);
        else frame = await Canvas.loadImage(`./pokeImages/frames/${pokemonData["Series"]}/${pokemonData["Type"]}/Stage2-Frame.png`);
    }

    context.drawImage(frame, x, y, bottom.width, bottom.height);
    context.drawImage(hp, x, y, bottom.width, bottom.height);
    context.drawImage(top, x, y, bottom.width, bottom.height);
    // context.drawImage(moves, x, y, bottom.width, bottom.height);
    context.drawImage(affection, x, y, bottom.width, bottom.height);
    
    if (pokemonData["CardType"] == "HOLO") {
        context.globalCompositeOperation = "multiply";
        context.drawImage(holoEffect, x, y, bottom.width, bottom.height);
        context.globalCompositeOperation = "source-over";
    }

    return context;
}

async function makePokeImagePull(pokemonData1, pokemonData2) {
    const canvas = Canvas.createCanvas(4060, 2280);
    let context = canvas.getContext('2d');

    context = await makePokeImageDict(pokemonData1, context, 270, 100);
    context = await makePokeImageDict(pokemonData2, context, 2300, 100);

    return canvas.encode('png');
}

async function makePokeImageTrade(pokemonData1, cardData1, pokemonData2, cardData2) {
    const canvas = Canvas.createCanvas(4520, 2280);
    let context = canvas.getContext('2d');

    context = await makePokeImageData(pokemonData1, cardData1, context, 270, 100);

    const trade = await Canvas.loadImage(`./resources/trade.png`);
    context.drawImage(trade, 1710, 740, 800, 800);

    context = await makePokeImageData(pokemonData2, cardData2, context, 2460, 100);

    return canvas.encode('png');
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

async function checkSeriesCollect(userCards, series, message) {
    let seriesDict = {}

    for (card of Object.keys(allCards[series])) {
        if (card[0] == '*' || card[0] == '[' || card[0] == '{') continue;

        seriesDict[card] = false;
        
    }

    for (uCard of userCards) {
        if (uCard.item.series == series) {
            seriesDict[uCard.item.name] = true;
        }
        
    }

    let has = 0;

    for ([card, have] of Object.entries(seriesDict)) {
        if (have == true) {
            has++;
        }
    }

    if (has == Object.keys(seriesDict).length) {
        
        const titleData = await TitleDatabase.findOne({ where: { name: seriesTitleData[series] } });

        if (!titleData) { return; }

        const userTitle = await UserTitles.findOne({ where: { user_id: message.author.id, title_id: titleData.id } });
        
        if (userTitle) { return; }

        await UserTitles.create({ user_id: message.author.id, title_id: titleData.id });

        await message.channel.send(`${message.author}, you have collected all cards in the \`${series} Pack\`. You have gained the title: \`${titleData.name}\``)
    }
}

module.exports = { getWhichStar, makePokeImage, makePokeImagePull, makePokeImageTrade, addBalance, raritySymbol, formatName, formatNameSmall, checkSeriesCollect };