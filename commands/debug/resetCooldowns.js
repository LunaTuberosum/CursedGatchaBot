const { Users } = require('../../dbObjects.js');

module.exports = {
    name: "resetcooldowns",
    shortName: ["rcd"],
        
    async execute(message) {
        if (message.member.permissionsIn(message.channel).has("ADMINISTRATOR")) {

            const user = await Users.findOne({ where: { user_id: message.author.id } });

            user.pull_cooldown = 0;
            user.save();
            user.grab_cooldown = 0;
            user.save();
            
            await message.channel.send({ content: `${message.author} your cooldowns have been reset` });

        }
        else {
            return;
        }

    }
};