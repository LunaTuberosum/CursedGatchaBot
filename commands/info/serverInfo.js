const { EmbedBuilder } = require("discord.js");
const { ServerInfo } = require("../../dbObjects");

function makeEmbed(message, server) {
    const serverEmbed = new EmbedBuilder()
        .setTitle('Server Info')
        .setDescription(`**Pull Channel:** ${server.pull_channel ? "Exists": "Does not exist"}\n**Raid Channel:** ${server.raid_channel ? "Exists": "Does not exist"}`)

    return serverEmbed;
}

module.exports = {
    name: "serverInfo",
    shortName: ["si", "server"],

    async execute(message) {

        const server = await ServerInfo.findOne({ where: { server_id: message.guild.id } });

        if (!server) { await message.channel.send(`${message.author}, this server hasn't been set up. Please contact an admin`); return; }
        
        await message.channel.send({ embeds: [makeEmbed(message, server)] });
    }
}