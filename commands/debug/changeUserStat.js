const { Users, UserStats } = require('../../dbObjects.js');

module.exports = {
    name: "changeuserstat",
    shortName: ["cus"],
        
    async execute(message) {
        if (message.member.permissionsIn(message.channel).has("ADMINISTRATOR")) {

            const user = await Users.findOne({ where: { user_id: message.author.id } });
            const userStat = await UserStats.findOne({ where: { user_id: message.author.id } });

            const splitMessage = message.content.split(" ");

            if (splitMessage.length != 3) return;

            if (splitMessage[1] == "grab") {
                userStat.card_grabbed = Number.parseInt(splitMessage[2]);
                userStat.save();
            }
            else if (splitMessage[1] == "pull") {
                userStat.card_drawn = Number.parseInt(splitMessage[2]);
                userStat.save();
            }
            else if (splitMessage[1] == "release") {
                userStat.card_released = Number.parseInt(splitMessage[2]);
                userStat.save();
            }
            else if (splitMessage[1] == "spent") {
                userStat.money_spent = Number.parseInt(splitMessage[2]);
                userStat.save();
            }

            await message.channel.send({ content: `${message.author} your stat has been changed.` });
        }
        else {
            return;
        }

        
    }
};