const { Users, ItemShop } = require('../../dbObjects.js');

module.exports = {
    name: "giveFullInv",
    shortName: ["gfi"],
        
    async execute(message) {
        if (message.member.permissionsIn(message.channel).has("ADMINISTRATOR")) {

            const user = await Users.findOne({ where: { user_id: message.author.id } });

            const items = await ItemShop.findAll();

            for (const item of items) {
                user.addItem(item, 999);
            }
        }
        else {
            return;
        }

        await message.channel.send({ content: `${message.author} your inventory has been filled` })
    }
};