const { Users, ServerInfo } = require('../../dbObjects.js');

module.exports = {
    name: "wishlistWatch",
    shortName: ["ww"],
        
    async execute(message) {
        const user = await Users.findOne({ where: { user_id: message.author.id } });

        const pullChannel = await ServerInfo.findOne({ where: { server_id: message.guild.id, pull_channel: message.channel.id } });

        if (!pullChannel) {
            await message.channel.send(`${message.author}, you can\'t set your wishlist channel to a non-pull channel.`);
            return;
        }

        if (user.wishlist_channel == message.channel.id) {
            await message.channel.send(`${message.author}, your wishlist channel has been removed from this channel.`);
            user.wishlist_channel = null;
            user.save();
            return;
        }

        user.wishlist_channel = message.channel.id;
        user.save();

        await message.channel.send(`${message.author}, your wishlist channel has been set to this channel.`);
    }
};