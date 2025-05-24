const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { Users, Tags} = require('../../dbObjects.js');
const { raritySymbol, formatName } = require("../../pullingObjects.js");
const { splitContent } = require("../../commandObjects.js");

function makeDeckEmbed(deckArray, user, start, end, total) {

    const deckEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Deck`)
        .setDescription(`Cards held by ${user}\n \
        ${deckArray.join("")}`)
        .setFooter({ text: `Showing cards ${start}-${end} of ${total}`})

    return deckEmbed;
}

function makeDeckEmbedEmpty(user) {

    const deckEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Deck`)
        .setDescription(`Cards held by ${user}\n \
        \n \
        **You have no cards.**`)
        .setFooter({ text: `Showing cards 0-0 of 0`})

    return deckEmbed;
}

function makeButton() {

    const leftButton = new ButtonBuilder()
        .setCustomId("left")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("◀️")
        .setDisabled(true);

    const rightButton = new ButtonBuilder()
        .setCustomId("right")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("▶️");

    const row = new ActionRowBuilder()
        .addComponents(leftButton, rightButton);

    return row;
}

async function getArray(userCards, start, end, message) {
    let i = 1;
    deckArray = []
    for (const card of userCards) {
        if (i > end) {
            break;
        }
        else if(i >= start) {
            const pokemonData = card.item
            let emojiTag;
            if (card.tag == "None") {
                emojiTag = ":black_medium_small_square:";
            }
            else {
                const tag = await Tags.findOne({ where: { user_id: message.author.id, name: card.tag } });
                emojiTag = tag.emoji;
            }
            deckArray.push(`\n${emojiTag} \`${card.item_id}\` - \`${raritySymbol(pokemonData.rarity)}\` - \`${pokemonData.series}\` - **${formatName(pokemonData)}** ${card.level == 5 ? "🩷" : card.level == 10 ? "❤️" : ""}`);
        }
        i++;
    }

    return deckArray;
}

function checkButtons(buttons, start, end, userCards) {
    buttons.components[0].setDisabled(false);
    buttons.components[1].setDisabled(false);
    if (start == 1) {
        buttons.components[0].setDisabled(true);
    }
    else if (end == userCards.length) {
        buttons.components[1].setDisabled(true);
    }
}

function _seriesSort(userCards, series) {
    if (series == "default") { userCards.sort((a, b) => a.item.series.localeCompare(b.item.series)); return userCards; }

    let seriesList = [];
    let otherList = [];

    for (card of userCards) {
        if (card.item.series == series) seriesList.push(card);
        else otherList.push(card);
    }

    seriesList.sort((a, b) => a.item.card_id.localeCompare(b.item.card_id));

    userCards = seriesList.concat(otherList);

    return userCards;
}

function _nameSort(userCards, name) {
    if (name == "default") { userCards.sort((a, b) => a.item.name.localeCompare(b.item.name)); return userCards; }

    let nameList = [];
    let otherList = [];

    for (card of userCards) {
        
        if (card.item.name == name) nameList.push(card);
        else otherList.push(card);
    }

    if (nameList.length == 0) {
        name = `${name[0].toUpperCase()}${name.substr(1).toLowerCase()}`

        for (card of userCards) {
        
            if (card.item.name == name) nameList.push(card);
            else otherList.push(card);
        }
    }

    userCards = nameList.concat(otherList);

    return userCards;
}

function _typeSort(userCards, type) {
    if (type == "default") { userCards.sort((a, b) => a.item.type.localeCompare(b.item.type)); return userCards; }

    let typeList = [];
    let otherList = [];

    for (card of userCards) {
        
        if (card.item.type == type) typeList.push(card);
        else otherList.push(card);
    }

    typeList.sort((a, b) => a.item.card_id.localeCompare(b.item.card_id));

    userCards = typeList.concat(otherList);

    return userCards;
}

function _specialSort(userCards, special) {
    if (special == "default") {
        let holoList = [];
        let frameList = [];
        let holoframeList = [];
        let otherList = [];

        for (card of userCards) {
        
            if (card.item.card_type == "HOLO") holoList.push(card);
            else if (card.item.card_type == "FRAME") frameList.push(card);
            else if (card.item.card_type == "HOLOFRAME") holoframeList.push(card);
            else otherList.push(card);
        }

        holoList.sort((a, b) => a.item.card_id.localeCompare(b.item.card_id));
        frameList.sort((a, b) => a.item.card_id.localeCompare(b.item.card_id));
        holoframeList.sort((a, b) => a.item.card_id.localeCompare(b.item.card_id));

        userCards = holoList.concat(frameList, holoframeList, otherList);

        return userCards;
    }

    let specialList = [];
    let otherList = [];

    for (card of userCards) {
        
        if (card.item.card_type == special) specialList.push(card);
        else otherList.push(card);
    }

    userCards = specialList.concat(otherList);

    return userCards;
}

function _levelSort(userCards, level) {
    if (level == "default") { userCards.sort((a, b) => b.level - a.level); return userCards; }

    let levelList = [];
    let otherList = [];

    for (card of userCards) {
        
        if (card.level == level) levelList.push(card);
        else otherList.push(card);
    }

    userCards = levelList.concat(otherList);

    return userCards;
}

function _tagSort(userCards, tag) {
    if (tag == "default") { userCards.sort((a, b) => a.tag.localeCompare(b.tag)); return userCards; }

    let tagList = [];
    let otherList = [];

    for (card of userCards) {
        
        if (card.tag == tag) tagList.push(card);
        else otherList.push(card);
    }

    userCards = tagList.concat(otherList);

    return userCards;
}

function _handleSort(userCards, sortKeys) {
    for (const key of sortKeys) {
        const data = key.split(":");
        switch (data[0].toLowerCase()) {
            case "series":
                if (data.length == 2) userCards = _seriesSort(userCards, data[1].toUpperCase());
                else userCards = _seriesSort(userCards, "default");
                break;

            case "type":
                if (data.length == 2) userCards = _typeSort(userCards, `${data[1][0].toUpperCase()}${data[1].substr(1).toLowerCase()}`);
                else userCards = _typeSort(userCards, "default");
                break;

            case "special":
                if (data.length == 2) userCards = _specialSort(userCards, data[1].toUpperCase());
                else userCards = _specialSort(userCards, "default");
                break;

            case "name":
                if (data.length == 2) userCards = _nameSort(userCards, data[1]);
                else userCards = _nameSort(userCards, "default");
                break;

            case "level":
                if (data.length == 2) userCards = _levelSort(userCards, Number(data[1]));
                else userCards = _levelSort(userCards, "default");
                break;

            case "tag":
                if (data.length == 2) userCards = _tagSort(userCards, data[1]);
                else userCards = _tagSort(userCards, "default");
                break;
        
            default:
                break;
        }
    }
    
    return userCards;
}

module.exports = {
    name: "deck",
    shortName: ["d"],
        
    async execute(message) {
        const response = await message.channel.send("Loading your deck...");
        const splitMessage = splitContent(message);

        const user = await Users.findOne({ where: { user_id: message.author.id } });
        if (!user) { await response.edit(`${message.author}, you are not registered. Please register using \`g!register\`.`); return; }
        
        let userCards = await user.getCards();

        if (userCards.length == 0) {
            await response.edit({ content: " ", embeds: [makeDeckEmbedEmpty(message.author)] });
            return;
        }

        if (splitMessage.length > 1) {
            userCards = _handleSort(userCards, splitMessage.slice(1));
        }

        if (userCards.length > 10) {
            let cardArray = await getArray(userCards, 1, 10, message);

            let start = 1;
            let end = 10;

            const buttons = makeButton();
            await response.edit({  content: " ",embeds: [makeDeckEmbed(cardArray, message.author, start, end, userCards.length)], components: [buttons] });

            const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

            collector.on("collect", async i => {
                i.deferUpdate();

                if (i.user == message.author) {
                    collector.resetTimer();

                    if (i.customId == "left") {
                        if (start - 10 < 1) {
                            start = 1;
                            end = 10;
                        }
                        else {
                            start -= 10;
                            end -= 10;
                        }
                        checkButtons(buttons, start, end, userCards);

                        cardArray = await getArray(userCards, start, end, message);
                        await response.edit({ content: " ", embeds: [makeDeckEmbed(cardArray, message.author, start, end, userCards.length)], components: [buttons] });

                    }
                    else if (i.customId == "right") {
                        if (end + 10 > userCards.length) {
                            start += userCards.length - end;
                            end = userCards.length;
                        }
                        else {
                            start += 10;
                            end += 10;
                        }
                        checkButtons(buttons, start, end, userCards);

                        cardArray = await getArray(userCards, start, end, message);
                        await response.edit({ content: " ", embeds: [makeDeckEmbed(cardArray, message.author, start, end, userCards.length)], components: [buttons] });
                    }
                }
                
                

            });
        }
        else {
            
            deckArray = []
            for (const card of userCards) {

                const pokemonData = card.item
                let emojiTag;
                if (card.tag == "None") {
                    emojiTag = ":black_medium_small_square:";
                }
                else {
                    const tag = await Tags.findOne({ where: { user_id: message.author.id, name: card.tag } });
                    if (!tag) { emojiTag = ":black_medium_small_square:";}
                    else emojiTag = tag.emoji;
                }
                deckArray.push(`\n${emojiTag} \`${card.item_id}\` - \`${raritySymbol(pokemonData.rarity)}\` - \`${pokemonData.series}\` - **${formatName(pokemonData)}** ${card.level == 10 ? "❤️" : card.level >= 5 ? "🩷" : ""}`);
            }
            
            message.channel.send({ content: " ", embeds: [makeDeckEmbed(deckArray, message.author, 1, userCards.length, userCards.length)] });
        }

    },
};