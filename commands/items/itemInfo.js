const { UserItems, ItemShop } = require("../../dbObjects");
const itemData = require("../../data/itemData.json");
const { EmbedBuilder } = require("discord.js");
const { splitContent } = require("../../commandObjects");

function makeEmbed(itemDict, amount) {
    const itemEmbed = new EmbedBuilder()
        .setTitle(`Item Info: ${itemDict["Name"]}`)
        .setDescription(`**How to Obtain:** ${itemDict["Get"]}\n**You Own:** ${amount}\n\n${itemDict["Description"]}`)
    return itemEmbed
}

module.exports = {
    cooldown: 5,
    name: 'itemInfo',
    shortName: ["ii"],

    async execute(message) {
        const splitMessage = splitContent(message);

        if (splitMessage.length < 2) { await message.channel.send(`${message.author}, please enter the item name that you would like to lookup.`); return; }

        splitMessage.splice(0, 1);

        const itemName = splitMessage.join(" ").toUpperCase();

        const itemInfo = await ItemShop.findOne({ where: { name: itemName } });

        if (!itemInfo) { awaitmessage.channel.send(`${message.author}, the item name you gave is either misspelled or does not exist.`); return; }

        let amount = 0;
        
        const userItem = await UserItems.findOne({ where: { user_id: message.author.id, item_id: itemInfo.id } });

        if (userItem) { amount = userItem.amount; }

        const itemDict = itemData[itemName];

        if (!itemDict) { await message.channel.send(`${message.author}, the item you gave is either not yet implimented or had no use.`); }

        await message.channel.send({ embeds: [makeEmbed(itemDict, amount)] });
        
    }
}