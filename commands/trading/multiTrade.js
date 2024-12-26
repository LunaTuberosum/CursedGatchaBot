const { EmbedBuilder, AttachmentBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { Users, UserCards, CardDatabase, ItemShop } = require("../../dbObjects");
const allCards = require("../../packs/allCards.json");
const { rarityStars } = require("../../pullingObjects.js");


function makeEmbed(user, otherUser, userTrade, otherUserTrade) {
    const tradeEmebed = new EmbedBuilder()
        .setTitle("Multi Trade")
        .setDescription(`${user}\'s items:\n${userTrade.join("\n")}\n\n${otherUser}\'s items:\n${otherUserTrade.join("\n")}`)
    return tradeEmebed;
}

function makeEmbedCancel(user, otherUser, userTrade, otherUserTrade) {
    const tradeEmebed = new EmbedBuilder()
        .setTitle("Card Trade")
        .setColor("#bd0f0f")
        .setDescription(`${user}\'s items:\n${userTrade.join("\n")}\n\n${otherUser}\'s items:\n${otherUserTrade.join("\n")}\n\n**Trade was canceled.**`)

    return tradeEmebed;
}

function makeEmbedConfirm(user, otherUser, userTrade, otherUserTrade) {
    const tradeEmebed = new EmbedBuilder()
        .setTitle("Card Trade")
        .setColor("#26bd0f")
        .setDescription(`${user}\'s items:\n${userTrade.join("\n")}\n\n${otherUser}\'s items:\n${otherUserTrade.join("\n")}\n\n**Trade was accepted.**`)

    return tradeEmebed;
}

function makeButton() {

    const confirmButton = new ButtonBuilder()
        .setCustomId("confirm")
        .setStyle(ButtonStyle.Success)
        .setEmoji("✔");

    const cancelButton = new ButtonBuilder()
        .setCustomId("cancel")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("✖");

    const row = new ActionRowBuilder()
        .addComponents(confirmButton, cancelButton);

    return row
}

function makeButtonConfirm() {

    const confirmButton = new ButtonBuilder()
        .setCustomId("confirm")
        .setStyle(ButtonStyle.Success)
        .setEmoji("✔")
        .setDisabled(true);

    const cancelButton = new ButtonBuilder()
        .setCustomId("cancel")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("✖");

    const finalConfirmButton = new ButtonBuilder()
        .setCustomId("finalConfirm")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("✔");

    const row = new ActionRowBuilder()
        .addComponents(confirmButton, cancelButton, finalConfirmButton);

    return row
}

function findCard(collection, cardCode) {
    for (const card of collection) {
        if (card.item_id == cardCode) {
            return card;
        }
    }
    return null;
}

function findItem(collection, itemName) {
    for (const item of collection) {
        if (item.item.name == itemName) {
            return item;
        }
    }
    return null;
}

async function generateUserTradeList(splitMessage, start, message) {
    if (splitMessage[start][0] != "\"") {
        await message.channel.send(`${message.author} both list of items/cards must be inclosed in \" \".`);
        return null;
    }

    tradeList = "";

    for (let i = start; i < splitMessage.length; i++) {
        sub = splitMessage[i];
        if (sub[sub.length - 1] == "\"") {
            tradeList += ` ${((sub.split("\"").filter(function (el) {
                return el != '';
            })[0]))}`;
            return tradeList.trim();
        }
        else if (sub[0] == "\"") {
           sub = sub.split("\"")[1];
        }

        tradeList += ` ${sub}`;
    }

    await message.channel.send(`${message.author} both list of items/cards must be inclosed in \" \".`);
    return null;
} 

async function checkTradeOffer(from, user, userAt, message, splitMessage) {
    let tradeList = (await generateUserTradeList(splitMessage, from, message)).split(",");
    if (!tradeList) return;

    let userTrade = {};
    for (let i = 0; i < tradeList.length; i++) {
        tradeItem = tradeList[i].trim();

        if (tradeItem.length == 6) {
            const cardInfo = findCard(await user.getCards(), tradeItem);
            if (!cardInfo) {
                await message.channel.send(`That card is not in ${userAt}\'s collection.`); 
                return;
            }
            userTrade[tradeItem] = [cardInfo, "1"];
            continue;
        }
        
        let itemList = tradeList[i].split(" ");

        let itemName = "";
        let quanity = "";
        for (let itemSub of itemList) {
            if ((itemSub.toLowerCase())[0] == "x") {
                quanity = (itemSub.toLowerCase()).split("x")[1];
                break;
            }

            itemName += ` ${itemSub}`;
        }
        itemName = (itemName.trim()).toUpperCase();

        if (!(await ItemShop.findOne({ where: { name: itemName } }))) {
            await message.channel.send(`${message.author} the item ${itemName} is misspelt.`);
            return;
        }

        const itemInfo = findItem(await user.getItems(), itemName);

        if (!itemInfo || itemInfo.amount < sub.substring(1)) {
            await message.channel.send(`${userAt} dosen't have enough of that item.`); 
            return;
        }
        userTrade[itemName] = [itemInfo, quanity];
    }

    return userTrade;
}

function getSecondTradeStart(splitMessage, message) {
    let count = 0
    for (let i = 0; i < splitMessage.length; i++) {
        if (splitMessage[i][0] == "\"") count++;

        if (count == 2) return i;
    }
    message.channel.send(`${message.author} both list of items/cards must be inclosed in \" \".`)
    return -1;
}

function getFormatUserTrade(userTrade) {
    let formatedUserTrade = []
    Object.entries(userTrade).forEach(([name, data]) => {
        if (name.length == 6) {
            const pokemonData = allCards[data[0].item.name]
            formatedUserTrade.push(`\`x${data[1]}\` **${pokemonData['CardID']}-${pokemonData['Name']}** - ${rarityStars(pokemonData['Rarity'])} - \`${data[0].item_id}\``);
        }
        else {
            formatedUserTrade.push(`\`x${data[1]}\` ${data[0].item.emoji} \`${data[0].item.name}\``);
        }
    });

    return formatedUserTrade;
}

async function transferTradeItems(otherUser, userTrade) {
    await Object.entries(userTrade).forEach(async ([name, data]) => {
        if (name.length == 6) {
            data[0].user_id = otherUser.user_id;
            data[0].save();
        }
        else {
            const itemData = await ItemShop.findOne({ where: { name: data[0].item.name } });
            data[0].amount -= data[1];
            data[0].save();

            otherUser.addItem(itemData, data[1]);
        }
    });
}

module.exports = {
    cooldown: 5,
    name: 'multiTrade',
    shortName: ['mt'],
        
    async execute(message) {
        let confirm = false;
        const splitMessage = message.content.split(" ");

        if (splitMessage.length < 4) {
            await message.channel.send(`${message.author}, you must specify the person your trading to, your list of cards/items, and their list of cards/items.`);
            return;
        }        

        const user = await Users.findOne({ where: { user_id: message.author.id } });
        if ((await user.getCards()).length == 1) {
            await message.channel.send(`${message.author} you can't multi trade with only one card.`);
            return;
        }

        const otherUser = await Users.findOne({ where : { user_id: message.mentions.users.first().id } });
        if ((await otherUser.getCards()).length == 1) {
            await message.channel.send(`${message.mentions.users.first()} can't be multi trade with when they have only one card.`);
            return;
        }

        if (user.user_id == otherUser.user_id) {
            await message.channel.send(`${message.author}, you can not trade to yourself.`);
            return;
        }

        if (!otherUser) {
            await message.channel.send(`${message.author}, that user can not be found. They must register first before they can be traded to or they do not exist.`);
            return;
        }

        let userTrade = await checkTradeOffer(2, user, message.author, message, splitMessage);
        if (!userTrade) return;
        const secondStart = getSecondTradeStart(splitMessage, message);
        if (secondStart == -1) return;
        let otherUserTrade = await checkTradeOffer(secondStart, otherUser, message.mentions.users.first(), message, splitMessage);
        if (!otherUserTrade) return;

        const formatUserTrade = getFormatUserTrade(userTrade);
        const formatOtherUserTrade = getFormatUserTrade(otherUserTrade);


        const response = await message.channel.send({ embeds: [makeEmbed(message.author, splitMessage[1], formatUserTrade, formatOtherUserTrade)], components: [makeButton()] });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15_000 });

        collector.on("collect", async i => {
            if (i.user == message.mentions.users.first() || i.user == message.author) {
                if(i.customId == "cancel") {
                    await response.edit({ embeds: [makeEmbedCancel(message.author, splitMessage[1], formatUserTrade, formatOtherUserTrade)], components: [] });
                    i.deferUpdate();
                }
            }
            if (i.user == message.mentions.users.first()) {
                if (i.customId == "confirm") {
                    await response.edit({ embeds: [makeEmbed(message.author, splitMessage[1], formatUserTrade, formatOtherUserTrade)], components: [makeButtonConfirm()] });
                    i.deferUpdate();
                }
            }
            else if (i.user == message.author) {
                if (i.customId == "finalConfirm") {

                    transferTradeItems(otherUser, userTrade);
                    transferTradeItems(user, otherUserTrade);

                    await response.edit({ embeds: [makeEmbedConfirm(message.author, splitMessage[1], formatUserTrade, formatOtherUserTrade)], components: [] });
                    i.deferUpdate();
                }
            }
        
        });
    },
};