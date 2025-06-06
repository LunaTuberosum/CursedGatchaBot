const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { Users, ItemShop, EventShop, UserStats, TitleDatabase, UserTitles } = require('../../dbObjects.js');
const { splitContent } = require("../../commandObjects.js");

function makeBuyEmbed(itemData, quantity, userAt) {

    const invEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Buy Item`)
        .setDescription(`**${itemData.name}**\n*${itemData.description}*\n\n${userAt} will **buy**\n\`\`\`diff\n+${quantity} ${itemData.name}(S)\`\`\`\nAt the **cost** of\n\`\`\`diff\n-${quantity * itemData.cost} ${itemData.itemCost}(S)\`\`\``)

    return invEmbed;
}

function makeBuyEmbedCancel(itemData, quantity, userAt) {

    const invEmbed = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setTitle(`Buy Item`)
        .setDescription(`**${itemData.name}**\n*${itemData.description}*\n\n${userAt} will **buy**\n\`\`\`diff\n+${quantity} ${itemData.name}(S)\`\`\`\nAt the **cost** of\n\`\`\`diff\n-${quantity * itemData.cost} ${itemData.itemCost}(S)\`\`\`\n**Purchase was canceled.**`)

    return invEmbed;
}

function makeBuyEmbedFail(itemData, quantity, userAt) {

    const invEmbed = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setTitle(`Buy Item`)
        .setDescription(`**${itemData.name}**\n*${itemData.description}*\n\n${userAt} will **buy**\n\`\`\`diff\n+${quantity} ${itemData.name}(S)\`\`\`\nAt the **cost** of\n\`\`\`diff\n-${quantity * itemData.cost} ${itemData.itemCost}(S)\`\`\`\n**You do not have the items required to buy this.**`)

    return invEmbed;
}

function makeBuyEmbedConfirm(itemData, quantity, userAt) {

    const invEmbed = new EmbedBuilder()
        .setColor("#26bd0f")
        .setTitle(`Buy Item`)
        .setDescription(`**${itemData.name}**\n*${itemData.description}*\n\n${userAt} will **buy**\n\`\`\`diff\n+${quantity} ${itemData.name}(S)\`\`\`\nAt the **cost** of\n\`\`\`diff\n-${quantity * itemData.cost} ${itemData.itemCost}(S)\`\`\`\n**Item has been bought.**`)

    return invEmbed;
}

function makeButton() {

    const cancelButton = new ButtonBuilder()
        .setCustomId("cancel")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("✖");

    const confirmButton = new ButtonBuilder()
        .setCustomId("confirm")
        .setStyle(ButtonStyle.Success)
        .setEmoji("✔")

    const row = new ActionRowBuilder()
        .addComponents(cancelButton, confirmButton);

    return row;
}

function findItem(collection, itemName) {
    for (const item of collection) {
        if (item.item.name == itemName) {
            return item;
        }
    }
    return null;
}

module.exports = {
    name: "buy",
    shortName: ["b"],
        
    async execute(message) {
        const splitMessage = splitContent(message);
        
        if (splitMessage.length == 1) {
            await message.channel.send(`${message.author} you must include the name of the item you wish to buy.`);
            return;
        }

        let eventItem = false;

        let itemName = "";
        let quantity = "";
        for (const sub of splitMessage) {
            if (sub.toLowerCase()[0]== "x" && !isNaN(sub.toLowerCase().split("x")[1])) {
                quantity = parseInt(sub.toLowerCase().split("x")[1]);
                break;
            }
            else if (sub.toLowerCase() == "gbuy" || sub.toLowerCase() == "gb") continue;

            itemName += ` ${sub}`;
        }
        itemName = (itemName.trim()).toUpperCase();
        if (quantity == "") quantity = "1";

        let itemData = await ItemShop.findOne({ where: { name: itemName } });

        if (!itemData || itemData.cost == 0) {
            itemData = await EventShop.findOne({ where: { name: itemName}});
            eventItem = true;

            if (!itemData || itemData.cost == 0) {
                await message.channel.send(`${message.author} the item ${itemName} is misspelt or is not an item you can buy.`);
                return;
            }
        }

        const user = await Users.findOne({ where: { user_id: message.author.id } });
        if (!user) { await message.channel.send(`${message.author}, you are not registered. Please register using \`g!register\`.`); return; }

        const userStat = await UserStats.findOne({ where: { user_id: user.user_id } });

        const buttons = makeButton()
        const response = await message.channel.send({ embeds: [makeBuyEmbed(itemData, quantity, message.author)], components: [buttons] })

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

        collector.on("collect", async i => {
            if (i.user == message.author) {
                await i.deferUpdate();
                if (i.customId == "cancel") {
                    await response.edit({ embeds: [makeBuyEmbedCancel(itemData, quantity, message.author)], components: [] });
                }
                else if (i.customId == "confirm") {
                    const userItems = await user.getItems();
                    const costItemData = await ItemShop.findOne({ where: { name: itemData.itemCost } });
                    const userItemData = findItem(userItems, costItemData.name);
                    
                    if (!userItemData) {
                        await response.edit({ embeds: [makeBuyEmbedFail(itemData, quantity, message.author)], components: [] });
                        return;
                    }

                    if (userItemData.amount < (quantity * itemData.cost)) {
                        await response.edit({ embeds: [makeBuyEmbedFail(itemData, quantity, message.author)], components: [] });
                        return;
                    }

                    user.addItem(itemData, quantity, eventItem);
                    userItemData.amount -= (quantity * itemData.cost);
                    userItemData.save();

                    await response.edit({ embeds: [makeBuyEmbedConfirm(itemData, quantity, message.author)], components: [] });

                    if (userItemData.item.name == "POKEDOLLAR") {
                        userStat.money_spent += quantity * itemData.cost;
                        userStat.save();

                        if (userStat.money_spent >= 1_000) {
                            const titleData = await TitleDatabase.findOne({ where: { name: "Big Spender" } });
    
                            if (!titleData) { return; }
    
                            const userTitle = await UserTitles.findOne({ where: { user_id: message.author.id, title_id: titleData.id } });
                            
                            if (userTitle) { return; }
    
                            await UserTitles.create({ user_id: message.author.id, title_id: titleData.id });
    
                            await message.channel.send(`${message.author}, you have spent 1,000 POKEDOLLARS! You have gained the title: \`${titleData.name}\``)
                        }
                    }
                    return;
                }
            }
        });
    }
}