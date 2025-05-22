const levelUpCost = require("./affectionData/levelUpCost.json");
const releaseRewards = require("./affectionData/releaseRewards.json");
const stateTypes = require("./affectionData/stateTypes.json");
const passiveData = require("./affectionData/passiveData.json");
const specialData = require("./affectionData/specialData.json");

function getLevelUpCost(card, level=0) {
    if (level == 0) level = card.level + 1

    return levelUpCost[card.item.card_type][level];
}

function getReleaseRange(card) {
    const baseRewards = releaseRewards[card.item.series][card.item.card_type];

    if (!baseRewards) return -1;

    const rewards = {};

    for (const _reward of baseRewards) {
        rewards[_reward["Name"]] = [_reward["Chance"], _reward["Range"][0], _reward["Range"][1]];
    }

    if (card.level <= 1) return rewards;

    for (let _level = 1; _level < card.level; _level++) {
        const levelUp = getLevelUpCost(card, _level);

        if (rewards[levelUp["Resource"]["Type"]]) {
            rewards[levelUp["Resource"]["Type"]][0] = 100
            rewards[levelUp["Resource"]["Type"]][2] += levelUp["Resource"]["Amount"];
            rewards[levelUp["Resource"]["Type"]][1] += levelUp["Resource"]["Amount"];
        }
        else rewards[levelUp["Resource"]["Type"]] = [100, levelUp["Resource"]["Amount"], levelUp["Resource"]["Amount"]];

        rewards["POKEDOLLAR"][1] += Number(levelUp["Money"]);
        rewards["POKEDOLLAR"][2] += Number(levelUp["Money"]);
    }

    return rewards;
}

function getReleaseReward(card) {
    const baseRewards = releaseRewards[card.item.series][card.item.card_type];

    if (!baseRewards) return -1;

    const rewards = {};

    for (const _reward of baseRewards) {
        const chance = Math.floor(Math.random() * (101 - 1) + 1);
        if (chance > _reward["Chance"]) continue;

        const amount = Math.floor(Math.random() * (_reward["Range"][0] - _reward["Range"][1]) + _reward["Range"][1]);
        rewards[_reward["Name"]] = amount
    }

    if (card.level <= 1) return rewards;

    for (let _level = 1; _level < card.level; _level++) {
        const levelUp = getLevelUpCost(card, _level);
        
        if (rewards[levelUp["Resource"]["Type"]]) rewards[levelUp["Resource"]["Type"]] += levelUp["Resource"]["Amount"];
        else rewards[levelUp["Resource"]["Type"]] = levelUp["Resource"]["Amount"];

        rewards["POKEDOLLAR"] += Number(levelUp["Money"]);
    }

    return rewards;
}

function getCurrentStats(card) {
    if (card.level == 0) {
        return { "HP": "20", "Attack": "0", "Defense": "0", "Speed": "0" };
    }
    return stateTypes[card.item.name][card.level];
}

function getCurrentStatsSeperate(pokemonData, card) {
    if (card.level == 0) {
        return { "HP": "20", "Attack": "0", "Defense": "0", "Speed": "0" };
    }
    return stateTypes[pokemonData.name][card.level];
}

function getNewStats(card) {
    return stateTypes[card.item.name][card.level + 1];
}

function getPassive(card) {
    return passiveData[card.item.series][card.item.poke_type][card.item.type]
}

function getSpecial(card) {
    return specialData[card.item.series][card.item.poke_type][card.item.type]
}

module.exports = { getLevelUpCost, getCurrentStats, getCurrentStatsSeperate, getNewStats, getPassive, getSpecial, getReleaseRange, getReleaseReward };

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