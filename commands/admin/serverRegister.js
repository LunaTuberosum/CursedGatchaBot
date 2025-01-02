const { ServerInfo } = require("../../dbObjects");

module.exports = {
    name: "serverRegister",
    shortName: ["sr", "sreg", "serverreg"],

    async execute(message) {
        if (message.member.permissionsIn(message.channel).has("ADMINISTRATOR")) {
            const server = await ServerInfo.findOne({ where: { server_id: message.guild.id } });

            if (server) { await message.channel.send(`${message.author}, this server is already registered.`) };
            
            await ServerInfo.create({ server_id: message.guild.id });

            await message.channel.send(`${message.author}, this server is now registered. Enjoy playing!`);
        }
        else {
            await message.channel.send(`Only admins can register a server.`);
            return;
        }
    }
}