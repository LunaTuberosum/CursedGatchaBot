const standedPack = require("./packs/standeredPack.json");
const allCards = require("./packs/allCards.json");
const { currency } = require("./dbObjects.js");

function getWhichStar() {

    // Make random number between 1 and 4
    const random = Math.floor(Math.random() * 100) + 1;

    // check what star that is
    if (random <= 60) {
        const pokemon = pullRandomCard(standedPack["common"]);
        return allCards[pokemon];
    }
    else if (random > 60 && random <= 90) {
        const pokemon = pullRandomCard(standedPack["uncommon"]);
        return allCards[pokemon];
    }
    else if (random > 90 && random <= 100) {
        const pokemon = pullRandomCard(standedPack["rare"]);
        return allCards[pokemon];
    }
}

function pullRandomCard(starArray) {

    // Make a random number base on the amount of pokemon in a list
    var randomNum = Math.round(Math.random() * starArray.length) + 1;

    if (randomNum > starArray.length) {
        randomNum = starArray.length;
    }
 

    var i = 1;
    for(const poke of starArray) {
        if (i == randomNum) {
            return poke;
        }
        i++;
    }

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

module.exports = { getWhichStar, addBalance, raritySymbol, formatName };