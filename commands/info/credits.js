const { EmbedBuilder } = require("discord.js");
const { ServerInfo } = require("../../dbObjects");

function makeEmbed(message) {
    const embed = new EmbedBuilder()
        .setTitle('Credits')
        .setDescription(`"Artist"/Streamer: <@${"442683891678052352"}>\nDeveloper/Bot Manager: <@${"356077776601743370"}>\nCard Border Maker: aschefield`)

    return embed;
}

module.exports = {
    name: "credits",

    async execute(message) {
        
        await message.channel.send({ embeds: [makeEmbed(message)] });
    }
}