const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { Users, ItemShop, EventShop, CharmShop, UserStats, TitleDatabase, UserTitles } = require('../../dbObjects.js');
const { splitContent } = require("../../commandObjects.js");

function makeBuyEmbed(itemData, quantity, userAt) {

    const invEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Buy Item`)
        .setDescription(`**${itemData.name}**\n*${itemData.description}*\n\n${userAt} will **buy**\n\`\`\`diff\n+${quantity} ${itemData.name}(S)\`\`\`\nAt the **cost** of\n\`\`\`diff\n-${quantity * itemData.cost} ${itemData.itemCost}(S)\`\`\``)

    return invEmbed;
}

function makeBuyCharmEmbed(itemData, quantity, userAt) {

    let charmCost = ""

    if (itemData.gemCost > 0) {
        charmCost += `\n-${quantity * itemData.gemCost} ${itemData.gemName} GEM(S)`
    }

    if (itemData.shardCost > 0) {
        charmCost += `\n-${quantity * itemData.shardCost} ${itemData.shardName} SHARD(S)`
    }

    if (itemData.itemCost > 0) {
        charmCost += `\n-${quantity * itemData.itemCost} ${itemData.itemName}(S)`
    }

    const invEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Buy Charm`)
        .setDescription(`**${itemData.name}**\n*${itemData.description}*\n\n${userAt} will **buy**\n\`\`\`diff\n+${quantity} ${itemData.name}(S)\`\`\`\nAt the **cost** of\n\`\`\`diff${charmCost}\`\`\``)

    return invEmbed;
}

function makeBuyEmbedCancel(itemData, quantity, userAt) {

    const invEmbed = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setTitle(`Buy Item`)
        .setDescription(`**${itemData.name}**\n*${itemData.description}*\n\n${userAt} will **buy**\n\`\`\`diff\n+${quantity} ${itemData.name}(S)\`\`\`\nAt the **cost** of\n\`\`\`diff\n-${quantity * itemData.cost} ${itemData.itemCost}(S)\`\`\`\n**Purchase was canceled.**`)

    return invEmbed;
}

function makeBuyCharmEmbedCancel(itemData, quantity, userAt) {

    let charmCost = ""

    if (itemData.gemCost > 0) {
        charmCost += `\n-${quantity * itemData.gemCost} ${itemData.gemName} GEM(S)`
    }

    if (itemData.shardCost > 0) {
        charmCost += `\n-${quantity * itemData.shardCost} ${itemData.shardName} SHARD(S)`
    }

    if (itemData.itemCost > 0) {
        charmCost += `\n-${quantity * itemData.itemCost} ${itemData.itemName}(S)`
    }

    const invEmbed = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setTitle(`Buy Charm`)
        .setDescription(`**${itemData.name}**\n*${itemData.description}*\n\n${userAt} will **buy**\n\`\`\`diff\n+${quantity} ${itemData.name}(S)\`\`\`\nAt the **cost** of\n\`\`\`diff${charmCost}\`\`\`\n**Purchase was canceled.**`)

    return invEmbed;
}

function makeBuyEmbedFail(itemData, quantity, userAt) {

    const invEmbed = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setTitle(`Buy Item`)
        .setDescription(`**${itemData.name}**\n*${itemData.description}*\n\n${userAt} will **buy**\n\`\`\`diff\n+${quantity} ${itemData.name}(S)\`\`\`\nAt the **cost** of\n\`\`\`diff\n-${quantity * itemData.cost} ${itemData.itemCost}(S)\`\`\`\n**You do not have the items required to buy this.**`)

    return invEmbed;
}

function makeBuyCharmEmbedFail(itemData, quantity, userAt) {

    let charmCost = ""

    if (itemData.gemCost > 0) {
        charmCost += `\n-${quantity * itemData.gemCost} ${itemData.gemName} GEM(S)`
    }

    if (itemData.shardCost > 0) {
        charmCost += `\n-${quantity * itemData.shardCost} ${itemData.shardName} SHARD(S)`
    }

    if (itemData.itemCost > 0) {
        charmCost += `\n-${quantity * itemData.itemCost} ${itemData.itemName}(S)`
    }

    const invEmbed = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setTitle(`Buy Charm`)
        .setDescription(`**${itemData.name}**\n*${itemData.description}*\n\n${userAt} will **buy**\n\`\`\`diff\n+${quantity} ${itemData.name}(S)\`\`\`\nAt the **cost** of\n\`\`\`diff${charmCost}\`\`\`\n**You do not have the items required to buy this.**`)

    return invEmbed;
}

function makeBuyEmbedConfirm(itemData, quantity, userAt) {

    const invEmbed = new EmbedBuilder()
        .setColor("#26bd0f")
        .setTitle(`Buy Item`)
        .setDescription(`**${itemData.name}**\n*${itemData.description}*\n\n${userAt} will **buy**\n\`\`\`diff\n+${quantity} ${itemData.name}(S)\`\`\`\nAt the **cost** of\n\`\`\`diff\n-${quantity * itemData.cost} ${itemData.itemCost}(S)\`\`\`\n**Item has been bought.**`)

    return invEmbed;
}

function makeBuyCharmEmbedConfirm(itemData, quantity, userAt) {

    let charmCost = ""

    if (itemData.gemCost > 0) {
        charmCost += `\n-${quantity * itemData.gemCost} ${itemData.gemName} GEM(S)`
    }

    if (itemData.shardCost > 0) {
        charmCost += `\n-${quantity * itemData.shardCost} ${itemData.shardName} SHARD(S)`
    }

    if (itemData.itemCost > 0) {
        charmCost += `\n-${quantity * itemData.itemCost} ${itemData.itemName}(S)`
    }

    const invEmbed = new EmbedBuilder()
        .setColor("#26bd0f")
        .setTitle(`Buy Item`)
        .setDescription(`**${itemData.name}**\n*${itemData.description}*\n\n${userAt} will **buy**\n\`\`\`diff\n+${quantity} ${itemData.name}(S)\`\`\`\nAt the **cost** of\n\`\`\`diff${charmCost}\`\`\`\n**Item has been bought.**`)

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

async function checkMoneySpend(message, userItemData, userStat, cost, quantity) {
    if (userItemData.item.name == "POKEDOLLAR") {
        userStat.money_spent += quantity * cost;
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
}

async function buyItem(message, itemData, quantity, user) {
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

                user.addItem(itemData, quantity);
                userItemData.amount -= (quantity * itemData.cost);
                userItemData.save();

                await response.edit({ embeds: [makeBuyEmbedConfirm(itemData, quantity, message.author)], components: [] });

                await checkMoneySpend(message, userItemData, userStat, itemData.cost, quantity);
                return;
            }
        }
    });
}

async function buyEvent(message, itemData, quantity, user) {
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

                user.addItem(itemData, quantity, 1);
                userItemData.amount -= (quantity * itemData.cost);
                userItemData.save();

                await response.edit({ embeds: [makeBuyEmbedConfirm(itemData, quantity, message.author)], components: [] });

                await checkMoneySpend(message, userItemData, userStat, itemData.cost, quantity);
                return;
            }
        }
    });
}

async function buyCharm(message, itemData, quantity, user) {
    const userStat = await UserStats.findOne({ where: { user_id: user.user_id } });

    const buttons = makeButton()
    const response = await message.channel.send({ embeds: [makeBuyCharmEmbed(itemData, quantity, message.author)], components: [buttons] })

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

    collector.on("collect", async i => {
        if (i.user == message.author) {
            await i.deferUpdate();

            if (i.customId == "cancel") {
                await response.edit({ embeds: [makeBuyCharmEmbedCancel(itemData, quantity, message.author)], components: [] });
            }
            else if (i.customId == "confirm") {
                const userItems = await user.getItems();
                let gemData = null;
                let gemUser = null;
                let shardData = null;
                let shardUser = null;
                let itemData_ = null;
                let itemUser = null;

                if (itemData.gemCost > 0) {
                    gemData = await ItemShop.findOne({ where: { name: `${itemData.gemName} GEM` } });
                    gemUser = findItem(userItems, gemData.name);

                    if (!gemUser || gemUser.amount < (quantity * itemData.gemCost)) {
                        await response.edit({ embeds: [makeBuyCharmEmbedFail(itemData, quantity, message.author)], components: [] });
                        return;
                    }
                }

                if (itemData.shardCost > 0) {
                    shardData = await ItemShop.findOne({ where: { name: `${itemData.shardName} SHARD` } });
                    shardUser = findItem(userItems, shardData.name);

                    if (!shardUser || shardUser.amount < (quantity * itemData.shardCost)) {
                        await response.edit({ embeds: [makeBuyCharmEmbedFail(itemData, quantity, message.author)], components: [] });
                        return;
                    }
                }

                if (itemData.itemCost > 0) {
                    itemData_ = await ItemShop.findOne({ where: { name: itemData.itemName } });
                    itemUser = findItem(userItems, itemData_.name);

                    if (!itemUser || itemUser.amount < (quantity * itemData.itemCost)) {
                        await response.edit({ embeds: [makeBuyCharmEmbedFail(itemData, quantity, message.author)], components: [] });
                        return;
                    }
                }
                
                if (gemUser) {
                    gemUser.amount -= (quantity * itemData.gemCost);
                    gemUser.save()
                }
                
                if (shardUser) {
                    shardUser.amount -= (quantity * itemData.shardCost);
                    shardUser.save()
                }
                
                if (itemUser) {
                    itemUser.amount -= (quantity * itemData.itemCost);
                    itemUser.save()
                }
                user.addItem(itemData, quantity, 2);
                
                await response.edit({ embeds: [makeBuyCharmEmbedConfirm(itemData, quantity, message.author)], components: [] });

                await checkMoneySpend(message, itemUser, userStat, itemData.itemCost, quantity);
                return;
            }
        }
    });
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
        
        const user = await Users.findOne({ where: { user_id: message.author.id } });
        if (!user) { await message.channel.send(`${message.author}, you are not registered. Please register using \`g!register\`.`); return; }


        let itemName = "";
        let quantity = "";
        for (const sub of splitMessage) {
            if (!isNaN(sub.toLowerCase())) {
                quantity = parseInt(sub);
                break;
            }
            else if (sub.toLowerCase() == "gbuy" || sub.toLowerCase() == "gb") continue;

            itemName += ` ${sub}`;
        }
        itemName = (itemName.trim()).toUpperCase();
        if (quantity == "") quantity = "1";

        let itemData = await ItemShop.findOne({ where: { name: itemName } });

        if (itemData && itemData.cost > 0) {
            await buyItem(message, itemData, quantity, user);
            return;
        }

        itemData = await EventShop.findOne({ where: { name: itemName } });

        if (itemData && itemData.cost > 0) {
            await buyEvent(message, itemData, quantity, user);
            return;
        }

        itemData = await CharmShop.findOne({ where: { name: itemName } });

        if (itemData && itemData.itemCost > 0) {
            await buyCharm(message, itemData, quantity, user);
            return;
        }

        await message.channel.send(`${message.author} the item ${itemName} is misspelt or is not an item you can buy.`);
        return;
    }
}