const { EmbedBuilder, AttachmentBuilder, ComponentType, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const { CardDatabase, Wishlists, Users } = require("../../dbObjects");
const { formatName, raritySymbol, makePokeImage } = require("../../pullingObjects");
const allCards = require("../../packs/allCards.json");
const { splitContent } = require("../../commandObjects");

function makeEmbed(pokemonData, wishlistInfo) {

    const embed = new EmbedBuilder()
        .setColor("#616161")
        .setImage(`attachment://poke-image.png`)
        .setTitle(`Pokedex - ${formatName(pokemonData)}`)
        .setDescription(`**Series** - ${pokemonData.series}\n**Rarity** - ${pokemonData.rarity} [${raritySymbol(pokemonData.rarity)}]\n**Card Type** - ${pokemonData.card_type}\n**Wishlisted** - ${wishlistInfo}\n\n**Time Pulled** - ${pokemonData.times_pulled}\n**Cards in Circulation** - ${pokemonData.in_circulation}\n\n**Poke #** - ${pokemonData.poke_number}\n**Day Drawn** - ${pokemonData.drawn_date}\n**Type** - ${pokemonData.type}\n\n**Get** - ${pokemonData.obtain}`)

    return embed;
}

function makeButton() {

    const leftButton = new ButtonBuilder()
        .setCustomId("left")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("◀️")

    const rightButton = new ButtonBuilder()
        .setCustomId("right")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("▶️");

    const row = new ActionRowBuilder()
        .addComponents(leftButton, rightButton);

    return row;
}

function makeSeriesEmbed(seriesDict, series) {

    const embed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Pokedex - ${series}`)
        .setDescription(`${Object.values(seriesDict).join("\n")}`)

    return embed;
}

async function _makeSeriesInfo(message, series, response) {
    let seriesDict = {}

    for (card of Object.keys(allCards[series])) {
        if (card[0] == '*' || card[0] == '[' || card[0] == '{') continue;
        const cardData = allCards[series][card];

        
        const pokemonData = await CardDatabase.findOne({ where: { name: cardData["Name"], series: cardData["Series"] } });

        seriesDict[card] = `${formatName(pokemonData)} - \`${raritySymbol(pokemonData.rarity)}\``;
        
    }

    const user = await Users.findOne({ where: { user_id: message.author.id } });
    if (!user) {
        await response.edit({ content: " ", embeds: [makeSeriesEmbed(seriesDict, series)] });
        return;
    }

    const userCards = await user.getCards();

    for (uCard of userCards) {
        if (uCard.item.series == series) {
            if (!seriesDict[uCard.item] && uCard.item.card_id == "000") {
                const pokemonData = await CardDatabase.findOne({ where: { name: uCard.item.name, series: uCard.item.series } });
                seriesDict[uCard.item.name] = `${formatName(pokemonData)} - \`${raritySymbol(pokemonData.rarity)}\` - ✅`;
                continue;
            }
            if (seriesDict[uCard.item.name][seriesDict[uCard.item.name].length - 1] == "✅") { continue; }
            seriesDict[uCard.item.name] = seriesDict[uCard.item.name] + " - ✅";
        }
        
    }

    await response.edit({ content: " ", embeds: [makeSeriesEmbed(seriesDict, series)] });
}

module.exports = {
    name: "pokedex",
    shortName: ["pd"],
        
    async execute(message) {
        const response = await message.channel.send("Loading the data...");

        const splitMessage = splitContent(message);

        if (splitMessage.length < 2) { await response.edit(`${message.author}, please enter the name of the pokemon you'd like to lookup`); return; }

        if (splitMessage[1].length == 4) {
            if (splitMessage[1].toUpperCase() == "EVE1")
                _makeSeriesInfo(message, "EVE1", response);
            if (splitMessage[1].toUpperCase() == "CRAP")
                _makeSeriesInfo(message, "CRAP", response);

            else { await response.edit(`${message.author}, that pokemon either dosen't exist or its name is misspelt.`); return; }
            return;
        }

        let pokeList = await CardDatabase.findAll({ where: { name: splitMessage[1] } });

        if (pokeList.length == 0) {
            const pokeName = `${splitMessage[1][0].toUpperCase()}${splitMessage[1].substr(1).toLowerCase()}`;
            pokeList = await CardDatabase.findAll({ where: { name: pokeName } });
        }
        
        if (pokeList.length == 0 || !pokeList) { await response.edit(`${message.author}, that pokemon either dosen't exist or its name is misspelt.`); return; }

        let pokeIndex = 0;

        if (splitMessage.length == 3) {
            let tempIndex = 0;
            
            if (splitMessage[2].toUpperCase() == "HOLO") {
                tempIndex = 1;
            }
            else if (splitMessage[2].toUpperCase() == "FRAME" && pokeList.length >= 3) {
                tempIndex = 2;
            }
            else if (splitMessage[2].toUpperCase() == "HOLOFRAME" && pokeList.length >= 3) {
                tempIndex = 3;
            }

            pokeIndex = tempIndex;
        }

        let wishlistInfo = (await Wishlists.findAll({ where: { card_id: pokeList[pokeIndex].card_id } })).length;

        let attachment = new AttachmentBuilder(await makePokeImage(pokeList[pokeIndex], null), { name: 'poke-image.png' });

        const buttons = makeButton();
        
        if (pokeIndex == 0) buttons.components[0].setDisabled(true);
        else if (pokeIndex == pokeList.length - 1) buttons.components[1].setDisabled(true);
        
        await response.edit({ content: " ", embeds: [makeEmbed(pokeList[pokeIndex], wishlistInfo)], files: [attachment], components: [buttons] });
        
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

        collector.on("collect", async i => {
            await i.deferUpdate();
            if (i.user.id != message.author.id) return;
            collector.resetTimer()

            if (i.customId == "right") {
                pokeIndex++;
                wishlistInfo = (await Wishlists.findAll({ where: { card_id: pokeList[pokeIndex].card_id } })).length;
                attachment = new AttachmentBuilder(await makePokeImage(pokeList[pokeIndex], null), { name: 'poke-image.png' });

                buttons.components[0].setDisabled(false);
                if (pokeIndex + 1 == pokeList.length) buttons.components[1].setDisabled(true);
                await response.edit({ content: " ", embeds: [makeEmbed(pokeList[pokeIndex], wishlistInfo)], files: [attachment], components: [buttons] });
            }
            else if (i.customId == "left") {
                pokeIndex--;
                wishlistInfo = (await Wishlists.findAll({ where: { card_id: pokeList[pokeIndex].card_id } })).length;
                attachment = new AttachmentBuilder(await makePokeImage(pokeList[pokeIndex], null), { name: 'poke-image.png' });

                buttons.components[1].setDisabled(false);
                if (pokeIndex == 0) buttons.components[0].setDisabled(true);
                await response.edit({ content: " ", embeds: [makeEmbed(pokeList[pokeIndex], wishlistInfo)], files: [attachment], components: [buttons] });
            }
        })
    }
}