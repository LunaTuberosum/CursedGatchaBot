const levelUpCost = require("./affectionData/levelUpCost.json");
const stateTypes = require("./affectionData/stateTypes.json");
const passiveData = require("./affectionData/passiveData.json");
const specialData = require("./affectionData/specialData.json");

function getLevelUpCost(card) {
    return levelUpCost[card.item.card_type][card.level + 1];
}

function getNewStats(card) {
    return stateTypes[card.item.name][card.level + 1];
}

function getPassive(card) {
    if (card.item.card_type == "HOLOFRAME") {
        return passiveData[card.item.card_type][card.item.name]
    }

    return passiveData[card.item.card_type][card.item.type]
}

function getSpecial(card) {
    if (card.item.card_type == "HOLOFRAME") {
        return specialData[card.item.card_type][card.item.name]
    }
    
    return specialData[card.item.card_type][card.item.type]
}

module.exports = { getLevelUpCost, getNewStats, getPassive, getSpecial };

// const { Collection } = require('discord.js');
// const fs = require('node:fs');
// const path = require('node:path');

// function instatatePassiveCollection(client) {
//     client.passiveCollection = new Collection();

//     const foldersPath = path.join(__dirname, 'passives');
//     const passiveFolders = fs.readdirSync(foldersPath);

//     for (const folder of passiveFolders) {
//         const passivePath = path.join(foldersPath, folder);
//         const passiveFiles = fs.readdirSync(passivePath).filter(file => file.endsWith(".js"));

//         for (const file of passiveFiles) {
//             const filePath = path.join(passivePath, file);
//             const passive = require(filePath);

//             client.passiveCollection.set(passive.name, passive);

//         }
//     }
// }

// function instatateSpecialCollection(client) {
//     client.specialCollection = new Collection();

//     const foldersPath = path.join(__dirname, 'specials');
//     const specialFolders = fs.readdirSync(foldersPath);

//     for (const folder of specialFolders) {
//         const specialPath = path.join(foldersPath, folder);
//         const specialFiles = fs.readdirSync(specialPath).filter(file => file.endsWith(".js"));

//         for (const file of specialFiles) {
//             const filePath = path.join(specialPath, file);
//             const special = require(filePath);

//             client.specialCollection.set(special.name, special);
//         }
//     }
// }

// module.exports = { instatatePassiveCollection, instatateSpecialCollection };