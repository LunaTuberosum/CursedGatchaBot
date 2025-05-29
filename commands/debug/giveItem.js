const { splitContent } = require('../../commandObjects.js');
const { Users, ItemShop, EventShop } = require('../../dbObjects.js');

module.exports = {
    name: "giveitem",
        
    async execute(message) {
        if (message.member.permissionsIn(message.channel).has("ADMINISTRATOR")) {
            const splitMessage = splitContent(message);

            const user = await Users.findOne({ where: { user_id: message.mentions.users.first().id } });

            let itemName = "";
            let itemEvent = "";
            let eventItem = false;
            let itemAmount = 0;

            for (const _sub in splitMessage) {
                if (_sub == 0 || _sub == 1) continue;

                if (Number.parseInt(splitMessage[_sub])) {
                    itemAmount = Number.parseInt(splitMessage[_sub])
                    continue;
                }

                if (splitMessage[_sub].includes("EVENT:")) {
                    itemEvent = splitMessage[_sub].slice(6)
                    continue;
                }
                itemName += `${splitMessage[_sub]} `;   
            }

            itemName = itemName.trim().toUpperCase();
            if (itemAmount == 0) itemAmount = 1;

            let itemData = await ItemShop.findOne({ where: { name: itemName } });
            if (!itemData) { 
                itemData = await EventShop.findOne({ where: { name: itemName, event: itemEvent }});
                eventItem = true

                if (!itemData) { await message.delete(); return; }
            }
            
            user.addItem(itemData, itemAmount, eventItem);

            await message.channel.send({ content: `${splitMessage[1]}, got \`${itemAmount} ${itemName}(s)\`!` });
            await message.delete();

        }
        else {
            return;
        }

    }
};