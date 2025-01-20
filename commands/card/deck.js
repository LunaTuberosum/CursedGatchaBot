const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { Users, Tags} = require('../../dbObjects.js');
const { raritySymbol, formatName } = require("../../pullingObjects.js");

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

module.exports = {
    name: "deck",
    shortName: ["d"],
        
    async execute(message) {
        const response = await message.channel.send("Loading your deck...");

        const user = await Users.findOne({ where: { user_id: message.author.id } });
        if (!user) { await response.edit(`${message.author}, you are not registered. Please register using \`g!register\`.`); return; }
        
        const userCards = await user.getCards();

        if (userCards.length == 0) {
            await response.edit({ content: " ", embeds: [makeDeckEmbedEmpty(message.author)] });
        }
        else {

            if (userCards.length > 10) {
                let cardArray = await getArray(userCards, 1, 10, message);

                let start = 1;
                let end = 10;

                const buttons = makeButton();
                await response.edit({  content: " ",embeds: [makeDeckEmbed(cardArray, message.author, start, end, userCards.length)], components: [buttons] });

                const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

                collector.on("collect", async i => {

                    if (i.user == message.author) {
                        i.deferUpdate();
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

        }
    },
};