const { getItemUse } = require("../../itemObjects.js")
const { Users, ItemShop } = require('../../dbObjects.js');
const { splitContent } = require("../../commandObjects.js");

function findItem(collection, itemName) {
    for (const item of collection) {
        if (item.item.name == itemName) {
            return item;
        }
    }
    return null;
}

module.exports = {
    name: "use",
    shortName: ["u"],
        
    async execute(message) {
        const splitMessage = splitContent(message);

        if (splitMessage.length == 1) {
            await message.channel.send({ content: `${message.author}, please include the name of the item you would like to use.` })
            return
        }

        let itemName = "";
        for (const sub of splitMessage) {
            if (sub.toLowerCase() == "guse" || sub.toLowerCase() == "gu") continue;

            itemName += ` ${sub}`;
        }
        itemName = (itemName.trim()).toUpperCase();

        const user = await Users.findOne({ where: { user_id: message.author.id } });
        if (!user) { await message.channel.send(`${message.author}, you are not registered. Please register using \`g!register\`.`); return; }
        const userItems = await user.getItems();
        const itemData = await ItemShop.findOne({ where: { name: itemName } });

        if (!itemData) {
            await message.channel.send({ content: `${message.author}, the ${itemName} item is misspelt or does not exits.` });
            return;
        };

        const userItemData = findItem(userItems, itemData.name);

        if (!userItemData) {
            await message.channel.send({ content: `${message.author}, you do not own a ${itemName}.` });
            return;
        };

        await getItemUse(itemName, message);
    }
}