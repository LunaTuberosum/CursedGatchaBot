const { EmbedBuilder } = require("discord.js");
const commandData = require("../../data/commandData.json");
const commandShortNameData = require("../../data/commandShortNameData.json");
const { splitContent } = require("../../commandObjects");

function makeHelpEmbed() {
    const helpEmbed = new EmbedBuilder()
        .setTitle("Cursed Bot Commands")
        .setDescription(`Type \`g!help\` followed by a command name to see more details about that command.`)
        .addFields(
            { name: "**⚙️ Setup**", value: "\`set\`, \`register\`", inline: true },
            { name: "**⚜️ Basic**", value: "\`pull\`, \`release\`, \`affection\`, \`daily\`", inline: true },
            { name: "**📚 Possessions**", value: "\`deck\`, \`inventory\`, \`tag\`, \`tagCreate\`, \`tagDelete\`, \`tagEmoji\`, \`tagRename\`, \`tags\`, \`untag\`, \`use\`, \`claim\`", inline: true },
            { name: "**📜 Events**", value: "\`event\`", inline: true },
            { name: "**ℹ️ Information**", value: "\`cooldown\`, \`cardInfo\`, \`pokeDex\`, \`itemInfo\`, \`userInfo\`, \`serverInfo\`, \`credits\`", inline: true },
            { name: "**🤞 Wishlist**", value: "\`wishlist\`, \`wishlistAdd\`, \`unWishlist\`, \`wishlistWatch\`", inline: true },
            { name: "**🪙 Shop**", value: "\`pokeShop\`, \`buy\`", inline: true },
            { name: "**🔁 Trade**", value: "\`trade\`, \`multiTrade\`, \`gift\`", inline: true },
            { name: "**❓ Other**", value: "\`help\`, \`bugReport\`", inline: true },
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
        const splitMessage = splitContent(message);

        if (splitMessage.length == 1) {
            await message.channel.send({ embeds: [makeHelpEmbed()] });
            return
        }

        let comamndName = splitMessage[1].toLowerCase();
        if (commandShortNameData[comamndName]) comamndName = commandShortNameData[comamndName];

        const commandDict = commandData[comamndName];
        if (!commandDict) {
            await message.channel.send(`${message.author}, ${comamndName} is not a valid command name.`);
            return;
        }

        await message.channel.send({ embeds: [makeCommandEmbed(commandDict)] });
    }
}