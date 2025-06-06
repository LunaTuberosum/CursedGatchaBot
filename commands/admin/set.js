const { ServerInfo } = require("../../dbObjects.js");

module.exports = {
    name: 'set',
        
    async execute(message) {
        if (message.member.permissionsIn(message.channel).has("ADMINISTRATOR")) {
            const splitMessage = message.content.split(" ")
            const server = await ServerInfo.findOne({ where: { server_id: message.guild.id } });

            if (!server) { await message.channel.send(`${message.author}, this server hasn't been set up. Please contact an admin`); return; }

            if (splitMessage.length != 2) {
                await message.channel.send(`Please specify what type of channel you are setting.`);
                return;
            }

            if (splitMessage[1].toLowerCase() == "pull") {
                server.pull_channel = message.channel.id
            }
            else if (splitMessage[1].toLowerCase() == "raid") {
                server.raid_channel = message.channel.id
            }
            server.save()

            
            const output = `${splitMessage[1][0].toUpperCase()}${splitMessage[1].substring(1)}`
            await message.channel.send(`${output} channel is set to ${message.channel}`);
        }
        else {
            await message.channel.send(`Only admins can set channels.`);
            return;
        }

    },
};