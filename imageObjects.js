const fs = require('node:fs');
const path = require('node:path');
const Canvas = require('@napi-rs/canvas');
const { getCurrentStatsSeperate } = require('./affectionObjects');

const imageDict = {}

async function createImageDict() {

    // Affection level images
    imageDict["affection"] = {
        "level0.png": await Canvas.loadImage(`./pokeImages/affection/level0.png`),
        "level5.png": await Canvas.loadImage(`./pokeImages/affection/level5.png`),
        "level10.png": await Canvas.loadImage(`./pokeImages/affection/level10.png`)
    };

    // Effect images
    imageDict["effects"] = {
        "HOLO.png": await Canvas.loadImage(`./pokeImages/effects/HOLO.png`)
    };

    // Frame Images
    const foldersPath = path.join(__dirname, 'pokeImages');
    const imageFolders = fs.readdirSync(foldersPath);

    const frameFolderPath = path.join(foldersPath, "frames");
    const frameFolders = fs.readdirSync(frameFolderPath);
    imageDict["frames"] = {};

    for (const series of frameFolders) {
        
        const typeFoldersPath = path.join(frameFolderPath, series);
        const typeFolders = fs.readdirSync(typeFoldersPath);

        for (const pType of typeFolders) {
            
            const framesPath = path.join(typeFoldersPath, pType);
            const frameFiles = fs.readdirSync(framesPath).filter(file => file.endsWith('.png'));
            
            for (const frame of frameFiles) {
                imageDict["frames"][`${series}/${pType}/${frame}`] = await Canvas.loadImage(path.join(framesPath, frame));
            }
        }
    }

    // Health images
    const healthFolderPath = path.join(foldersPath, "health");
    const healthFiles = fs.readdirSync(healthFolderPath).filter(file => file.endsWith('.png'));
    imageDict["health"] = {};

    for (const health of healthFiles) {
        imageDict["health"][health] = await Canvas.loadImage(path.join(healthFolderPath, health));
    }
    
    // MAKE move images in next update

    // Pokemon Images
    const pokemonFolderPath = path.join(foldersPath, "pokemon");
    const pokemonFolders = fs.readdirSync(pokemonFolderPath);
    imageDict["pokemon"] = {};

    for (const series of pokemonFolders) {
        
        const pokeFoldersPath = path.join(pokemonFolderPath, series);
        const pokeFolders = fs.readdirSync(pokeFoldersPath);

        for (const poke of pokeFolders) {
            const pokePath = path.join(pokeFoldersPath, poke);
            const pokeFiles = fs.readdirSync(pokePath).filter(file => file.endsWith('.png'));
            
            for (const pImage of pokeFiles) {
                imageDict["pokemon"][`${series}/${poke}/${pImage}`] = await Canvas.loadImage(path.join(pokePath, pImage));
            }
        }
    }

    imageDict["CardBack.png"] = await Canvas.loadImage(path.join(foldersPath, "CardBack.png"));

}

function getImage(folder, pokemonData, type) {
    switch (type) {
        case "DICT":
            return _getImageDict(folder, pokemonData);

        case "DATA":
            return _getImageData(folder, pokemonData);
    
        default:
            break;
    }
}

function _getImageDict(folder, pokemonData) {
    switch (folder) {
        case "affection":
            return imageDict["affection"]["level0.png"];

        case "effects":
            return imageDict["effects"][pokemonData];

        case "frames":
            let frame = imageDict["frames"][`${pokemonData["Series"]}/${pokemonData["Type"]}/Normal-Frame.png`];

            if (pokemonData["PokeType"] == "BASIC") {
                if (pokemonData["CardType"] == "FRAME" || pokemonData["CardType"] == "HOLOFRAME") frame = imageDict["frames"][`${pokemonData["Series"]}/${pokemonData["Type"]}/Full-Frame.png`];
                else frame = imageDict["frames"][`${pokemonData["Series"]}/${pokemonData["Type"]}/Normal-Frame.png`];
            }
            else if (pokemonData["PokeType"] == "STAGE 1") {
                if (pokemonData["CardType"] == "FRAME" || pokemonData["CardType"] == "HOLOFRAME") frame = imageDict["frames"][`${pokemonData["Series"]}/${pokemonData["Type"]}/FullStage1-Frame.png`];
                else frame = imageDict["frames"][`${pokemonData["Series"]}/${pokemonData["Type"]}/Stage1-Frame.png`];
            }
            else if (pokemonData["PokeType"] == "STAGE 2") {
                if (pokemonData["CardType"] == "FRAME" || pokemonData["CardType"] == "HOLOFRAME") frame = imageDict["frames"][`${pokemonData["Series"]}/${pokemonData["Type"]}/FullStage2-Frame.png`];
                else frame = imageDict["frames"][`${pokemonData["Series"]}/${pokemonData["Type"]}/Stage2-Frame.png`];
            }
            
            return frame

        case "health":
            return imageDict["health"]["20.png"];

        case "pokemon-bottom":
            return imageDict["pokemon"][`${pokemonData["Series"]}/${pokemonData["Name"]}/Bottom.png`];

        case "pokemon-top":
            return imageDict["pokemon"][`${pokemonData["Series"]}/${pokemonData["Name"]}/Top-${pokemonData["CardType"]}.png`];

        case "CardBack.png":
            return imageDict["CardBack.png"];
    
        default:
            break;
    }
}

function _getImageData(folder, cardData) {
    switch (folder) {
        case "affection":

            let  affection = imageDict["affection"]["level0.png"];
                
            if (cardData.level >= 5 && cardData.level < 10) {
                affection = imageDict["affection"]["level5.png"];
            }
            else if (cardData.level >= 10) {
                affection = imageDict["affection"]["level10.png"];
            }

            return affection;

        case "effects":
            return imageDict["effects"][cardData];

        case "frames":
            let frame = imageDict["frames"][`${cardData.item.series}/${cardData.item.type}/Normal-Frame.png`];

            if (cardData.item.poke_type == "BASIC") {
                if (cardData.item.card_type == "FRAME" || cardData.item.card_type == "HOLOFRAME") frame = imageDict["frames"][`${cardData.item.series}/${cardData.item.type}/Full-Frame.png`];
                else frame = imageDict["frames"][`${cardData.item.series}/${cardData.item.type}/Normal-Frame.png`];
            }
            else if (cardData.item.poke_type == "STAGE 1") {
                if (cardData.item.card_type == "FRAME" || cardData.item.card_type == "HOLOFRAME") frame = imageDict["frames"][`${cardData.item.series}/${cardData.item.type}/FullStage1-Frame.png`];
                else frame = imageDict["frames"][`${cardData.item.series}/${cardData.item.type}/Stage1-Frame.png`];
            }
            else if (cardData.item.poke_type == "STAGE 2") {
                if (cardData.item.card_type == "FRAME" || cardData.item.card_type == "HOLOFRAME") frame = imageDict["frames"][`${cardData.item.series}/${cardData.item.type}/FullStage2-Frame.png`];
                else frame = imageDict["frames"][`${cardData.item.series}/${cardData.item.type}/Stage2-Frame.png`];
            }
            
            return frame

        case "health":
            return imageDict["health"][`${getCurrentStatsSeperate(cardData.item, cardData)["HP"]}.png`];

        case "pokemon-bottom":
            return imageDict["pokemon"][`${cardData.item.series}/${cardData.item.name}/Bottom.png`];

        case "pokemon-top":
            return imageDict["pokemon"][`${cardData.item.series}/${cardData.item.name}/Top-${cardData.item.card_type}.png`];

        case "CardBack.png":
            return imageDict["CardBack.png"];
    
        default:
            break;
    }
}

module.exports = { createImageDict, getImage };