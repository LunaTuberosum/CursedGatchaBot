const { Users, ItemShop } = require('../../dbObjects.js');

module.exports = {
    name: "giveitem",
        
    async execute(message) {
        if (message.member.permissionsIn(message.channel).has("ADMINISTRATOR")) {
            const splitMessage = message.content.split(" ");

            const user = await Users.findOne({ where: { user_id: message.mentions.users.first().id } });

            const itemData = await ItemShop.findOne({ where: { name: splitMessage[2].toUpperCase() } });
            if (!itemData) { await message.delete(); return; }
            
            user.addItem(itemData, Number.parseInt(splitMessage[3]));

            await message.channel.send({ content: `${splitMessage[1]}, sorry for your troubles please enjoy \`${splitMessage[3]} ${splitMessage[2].toUpperCase()}(s)\`!` });
            await message.delete();

        }
        else {
            return;
        }

    }
};