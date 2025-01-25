const { Users } = require('../../dbObjects.js');

module.exports = {
    name: "resetusercooldowns",
    shortName: ["rucd"],
        
    async execute(message) {
        if (message.member.permissionsIn(message.channel).has("ADMINISTRATOR")) {

            const user = await Users.findOne({ where: { user_id: message.mentions.users.first().id } });

            user.pull_cooldown = 0;
            user.save();
            user.grab_cooldown = 0;
            user.save();
            
            await message.delete();
            await message.channel.send({ content: `${message.author}, ${message.mentions.users.first().username}'s cooldowns have been reset` });

        }
        else {
            return;
        }

    }
};