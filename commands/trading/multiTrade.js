const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { Users, UserCards, CardDatabase, ItemShop } = require("../../dbObjects");
const { formatName, raritySymbol } = require("../../pullingObjects.js");


function makeEmbed(user, otherUser, userTrade, otherUserTrade, checkUser) {
    
    const tradeEmebed = new EmbedBuilder()
        .setTitle(`Multiple Trade [${user.username} <--> ${otherUser.username}]`)
        .setDescription(`**${user}\'s items:**${checkUser == 0 ? " ✅" : ""}\n\`\`\`diff\n${userTrade.length ? userTrade.join("\n") : "- No items seleceted..."}\`\`\`\n**${otherUser}\'s items:**${checkUser == 1  ? " ✅" : ""}\n\`\`\`diff\n${otherUserTrade.length ? otherUserTrade.join("\n") : "- No items seleceted..."}\`\`\`\nTo add a \`Card\`, type its card code. **EX:** aa0000\nTo remove a \`Card\`, type its card code again. **EX:** aa0000\n\nTo add an \`Item\`, type its name followed it its amount.**EX:** Draw 5 x2\nTo remove an \`Item\`, type its name and its amount as 0. **EX:** Draw 5 x0\n*The \"x\" in front of the amount is required*\n\nTo add multiple cards or items at a time, sperate each thing using commas. \n**EX:** aa0000, aa0001, Draw 5 x2`)
    return tradeEmebed;
}

function makeEmbedCancel(user, otherUser, userTrade, otherUserTrade) {
    const tradeEmebed = new EmbedBuilder()
        .setTitle("Multiple Trade [Canceled]")
        .setColor("#bd0f0f")
        .setDescription(`**${user}\'s items:**\n\`\`\`diff\n${userTrade.length ? userTrade.join("\n") : "- No items seleceted..."}\`\`\`\n**${otherUser}\'s items:**\n\`\`\`diff\n${otherUserTrade.length ? otherUserTrade.join("\n") : "- No items seleceted..."}\`\`\`\n\n**Trade was canceled.**`)

    return tradeEmebed;
}

function makeEmbedConfirm(user, otherUser, userTrade, otherUserTrade) {
    const tradeEmebed = new EmbedBuilder()
        .setTitle("Multiple Trade [Finished]")
        .setColor("#26bd0f")
        .setDescription(`**${user}\'s items:** ✅\n\`\`\`diff\n${userTrade.length ? userTrade.join("\n") : "- No items seleceted..."}\`\`\`\n**${otherUser}\'s items:** ✅\n\`\`\`diff\n${otherUserTrade.length ? otherUserTrade.join("\n") : "- No items seleceted..."}\`\`\`\n\n**Trade was accepted.**`)

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

function getItemData(splitMessage) {
    let itemNameList = [];
    let itemAmount = 1;

    for (m of splitMessage) {
        if (m.toLowerCase()[0]== "x" && !isNaN(m.toLowerCase().split("x")[1])) {
            itemAmount = m.toLowerCase().split("x")[1];
            continue;
        }

        itemNameList.push(m);
    }

    const itemName = itemNameList.join(" ").toUpperCase();
    
    return [itemName, itemAmount];
}

function isInTradeCard(userTradeData, cardInfo) {
    if (userTradeData.length == 0) { return -1; }    

    for (index in userTradeData) {
        const _cardI = userTradeData[index];
        if (_cardI.item_id == cardInfo.item_id) {
            return index;
        }
    }

    return -1;
}

function isInTradeItem(userTradeData, itemInfo) {
    if (userTradeData.length == 0) { return null; }
    
    for (_itemI of userTradeData) {
        if (_itemI[0].item_id == itemInfo.item_id) {
            return _itemI;
        }
    }
    return null;
}

function transferTradeItems(otherUser, userTradeData) {
    for (card of userTradeData["Cards"]) {
        card.user_id = otherUser.user_id;
        card.save();
    }

    for (itemData of userTradeData["Items"]) {
        itemData[0].amount -= itemData[1];
        itemData[0].save();

        otherUser.addItem(itemData[0].item, itemData[1]);
    }
}

module.exports = {
    cooldown: 5,
    name: 'multiTrade',
    shortName: ['mt'],
        
    async execute(message) {
        const splitMessage = message.content.split(" ");

        if (splitMessage.length < 2) {
            await message.channel.send({ content: `${message.author}, you must specify the person you are trading with.` });
            return;
        }

        const user = await Users.findOne({ where: { user_id: message.author.id } });
        const userTrade = []
        const userTradeData = {
            "Cards": [], // card
            "Items": []  // [item, amount]
        }

        const otherUser = await Users.findOne({ where : { user_id: message.mentions.users.first().id } });
        const otherUserTrade = []
        const otherUserTradeData = {
            "Cards": [], // card
            "Items": []  // [item, amount]
        }

        if (!otherUser) {
            await message.channel.send({ content: `${message.author}, that user can not be found. They must register first before they can be traded to or they do not exist.` });
            return;
        }
        
        if (user.user_id == otherUser.user_id) {
            await message.channel.send(`${message.author}, you can not trade to yourself.`);
            return;
        }
        let otherConfirmUser;
        let checkUser = -1;

        const response = await message.channel.send({ embeds: [makeEmbed(message.author, message.mentions.users.first(), userTrade, otherUserTrade, checkUser)], components: [makeButton()] });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120_000 });
        const messageCollector = message.channel.createMessageCollector({ time: 120_000 });

        // MESSAGE HANDLER
        messageCollector.on('collect', async m => {
            let _tradeUser;
            let _tradeUserTrade;
            let _tradeUserTradeData;
            if (m.author.id == user.user_id) { 
                _tradeUser = user;
                _tradeUserTrade = userTrade; 
                _tradeUserTradeData = userTradeData 
            }
            else if (m.author.id == otherUser.user_id) { 
                _tradeUser = otherUser;
                _tradeUserTrade = otherUserTrade; 
                _tradeUserTradeData = otherUserTradeData 
            }
            else { return; }

            const splitM = m.content.split(",");
            otherConfirmUser = null;
            let checkUser = -1;
            m.delete();

            for (_m of splitM) {
                const _splitM = _m.trim().split(" ");

                if (_splitM.length == 1 && _splitM[0].length == 6) {
                    const cardInfo = findCard(await _tradeUser.getCards(), _splitM[0].toLowerCase());
    
                    if (!cardInfo) {
                        continue;
                    }

                    const existingCard = isInTradeCard(_tradeUserTradeData["Cards"], cardInfo);
                    if (existingCard > -1) {
                        _tradeUserTradeData["Cards"].splice(existingCard, 1);

                        const cardTextIndex = _tradeUserTrade.indexOf(`x1 ${formatName(cardInfo.item)} - ${raritySymbol(cardInfo.item.rarity)} - ${cardInfo.item_id}`);
                        _tradeUserTrade.splice(cardTextIndex, 1);
                        continue;
                    }
    
                    _tradeUserTradeData["Cards"].push(cardInfo);
                    _tradeUserTrade.push(`x1 ${formatName(cardInfo.item)} - ${raritySymbol(cardInfo.item.rarity)} - ${cardInfo.item_id}`);
    
                }
                else {
                    const itemData = getItemData(_splitM);
                    const itemInfo = findItem(await _tradeUser.getItems(), itemData[0]);

                    if (!itemInfo || itemInfo.amount < itemData[1]) {
                        continue;
                    }

                    const existingItem = isInTradeItem(_tradeUserTradeData["Items"], itemInfo);
                    if (existingItem) {
                        if (itemData[1] == "0") {
                            const itemTextIndex = _tradeUserTrade.indexOf(`x${existingItem[1]} ${existingItem[0].item.name}`);
                            _tradeUserTrade.splice(itemTextIndex, 1);

                            const itemIndex = _tradeUserTradeData["Items"].indexOf(existingItem);
                            _tradeUserTradeData["Items"].splice(itemIndex, 1);
                            continue;
                        }

                        const itemTextIndex = _tradeUserTrade.indexOf(`x${existingItem[1]} ${existingItem[0].item.name}`);
                        existingItem[1] += Number.parseInt(itemData[1]);
                        _tradeUserTrade[itemTextIndex] = `x${existingItem[1]} ${existingItem[0].item.name}`;
                        continue;
                    }
                    
                    _tradeUserTradeData["Items"].push([itemInfo, Number.parseInt(itemData[1])]);
                    _tradeUserTrade.push(`x${itemData[1]} ${itemInfo.item.name}`);
                }
            }
            
            await response.edit({ embeds: [makeEmbed(message.author, message.mentions.users.first(), userTrade, otherUserTrade, checkUser)], components: [makeButton()] });
        });

        messageCollector.on("end", async i => {
            await response.edit({ embeds: [makeEmbedCancel(message.author, message.mentions.users.first(), userTrade, otherUserTrade)], components: [] });
        });

        // BUTTON HANDLER

        collector.on("collect", async i => {
            if (i.user.id == user.user_id) { null }
            else if (i.user.id == otherUser.user_id) { null }
            else { i.deferUpdate(); return; }

            if (i.customId == "confirm") {
                if (i.user.id == user.user_id) { otherConfirmUser = otherUser; checkUser = 0; }
                else if (i.user.id == otherUser.user_id) { otherConfirmUser = user; checkUser = 1; }

                await response.edit({ embeds: [makeEmbed(message.author, message.mentions.users.first(), userTrade, otherUserTrade, checkUser)], components: [makeButtonConfirm()] });
                i.deferUpdate();
            }

            else if (i.customId == "finalConfirm" && i.user.id == otherConfirmUser.user_id) {

                transferTradeItems(otherUser, userTradeData);
                transferTradeItems(user, otherUserTradeData);

                messageCollector.stop()
                await response.edit({ embeds: [makeEmbedConfirm(message.author, message.mentions.users.first(), userTrade, otherUserTrade)], components: [] });
                i.deferUpdate();
            }

            else if (i.customId == 'cancel') {
                messageCollector.stop()
                i.deferUpdate();
            }
        });
    },
};