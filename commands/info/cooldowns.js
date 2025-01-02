const { EmbedBuilder } = require("discord.js");
const { Users } = require('../../dbObjects.js');

function makeCooldownEmbed(message, pullMessage, grabMessage) {
    const cooldownEmbed = new EmbedBuilder()
        .setTitle('Cooldowns')
        .setDescription(`For user ${message.author}\n\n${pullMessage}\n${grabMessage}`)

    return cooldownEmbed;
}

module.exports = {
    name: "cooldown",
    shortName: ["cd"],
        
    async execute(message) {
        const user = await Users.findOne({ where: { user_id: message.author.id } });
        if (!user) { await message.channel.send(`${message.author}, you are not registered. Please register using \ng!register\`.`); return; }
        const now = Date.now();

        const pullCD = Math.round((user.pull_cooldown - now) / 60_000);
        let pullMessage;

        if (pullCD <= 0) {
            pullMessage = `**Pull** is available \`now\``;
        }
        else {
            pullMessage = `**Pull** is available in \`${pullCD} minutes\``;
        }

        const grabCD = Math.round((user.grab_cooldown - now) / 60_000);
        let grabMessage;

        if (grabCD <= 0) {
            grabMessage = `**Grab** is available \`now\``;
        }
        else {
            grabMessage = `**Grab** is available in \`${grabCD} minutes\``;
        }

        const cooldownEmbed = makeCooldownEmbed(message, pullMessage, grabMessage);

        await message.channel.send({ embeds: [cooldownEmbed] });
        
    }
};