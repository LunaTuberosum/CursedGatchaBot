const { EmbedBuilder } = require("discord.js");
const commandData = require("../../data/commandData.json");

function makeHelpEmbed() {
    const helpEmbed = new EmbedBuilder()
        .setTitle("Cursed Bot Commands")
        .setDescription(`Type \`g!help\` followed by a command name to see more details about that command.`)
        .addFields(
            { name: "**⚙️ Setup**", value: "\`set\`, \`register\`", inline: true },
            { name: "**⚜️ Basic**", value: "\`pull\`, \`release\`, \`affection\`", inline: true },
            { name: "**📚 Possessions**", value: "\`deck\`, \`inventory\`, \`tag\`, \`tagCreate\`, \`tagDelete\`, \`tagEmoji\`, \`tagRename\`, \`tags\`, \`untag\`, \`use\`", inline: true },
            { name: "**ℹ️ Information**", value: "\`cooldown\` \`cardInfo\`, \`pokeDex\`, \`itemInfo\`, \`userInfo\`, \`serverInfo\`, \`credits\`", inline: true },
            { name: "**🤞 Wishlist**", value: "\`wishlist\`, \`wishlistAdd\`, \`unWishlist\`, \`wishlistWatch\`", inline: true },
            { name: "**🪙 Shop**", value: "\`pokeShop\`, \`buy\`", inline: true },
            { name: "**🔁 Trade**", value: "\`trade\`, \`multiTrade\`, \`gift\`", inline: true },
            { name: "**❓ Other**", value: "\`help\`", inline: true },
        )

    return helpEmbed;
}

function makeCommandEmbed(commandDict) {
    const commandEmbed = new EmbedBuilder()
        .setTitle(`Command Info: ${commandDict["Command"]}`)
        .setDescription(`${'Usage' in commandDict ? `Usage: ${commandDict["Usage"]}\n\n` : ""} ${commandDict["Description"]}`)
        .setFooter({ text: "Paramaters with an asterisk (*) are optional" })

    return commandEmbed
}

module.exports = {
    cooldown: 5,
    name: 'help',
    shortName: ['h'],
        
    async execute(message) {
        const splitMessage = message.content.split(" ");

        if (splitMessage.length == 1) {
            await message.channel.send({ embeds: [makeHelpEmbed()] });
            return
        }

        const commandDict = commandData[splitMessage[1].toLowerCase()];
        if (!commandDict) {
            await message.channel.send(`${message.author}, ${splitMessage[1]} is not a valid command name.`);
            return;
        }

        await message.channel.send({ embeds: [makeCommandEmbed(commandDict)] });
    }
}