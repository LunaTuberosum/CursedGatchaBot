const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { Users, UserStats, UserTitles, TitleDatabase } = require("../../dbObjects");
const { splitContent } = require("../../commandObjects");

function makeEmbed(user, userAt, userStat, titleList) {
    const embed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle("User Stats")
        .setDescription(`**User:** ${userAt}\n**Titles:** ${titleList.join(", ")}\n\n📚 **Cards:**\nCards Released: \`${userStat.card_released}\`\nCards Pulled: \`${userStat.card_drawn}\`\nCards Grabbed: \`${userStat.card_grabbed}\`\n\n🪙 **Shop:**\nMoney Spent: \`${userStat.money_spent}\`\nMoney Own: \`${userStat.money_own}\``)
    return embed
}

function makeTitleEmbed(userAt, titleDesc) {
    const embed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle("User Stats - Titles")
        .setDescription(`**User:** ${userAt}\n\n${titleDesc.join("\n")}`)
    return embed
}

function makeButton() {

    const statButton = new ButtonBuilder()
        .setCustomId("stats")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("📊");

    const titleButton = new ButtonBuilder()
        .setCustomId("titles")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("📋");

    const row = new ActionRowBuilder()
        .addComponents(statButton, titleButton);

    return row;
}

module.exports = {
    name: "userInfo",
    shortName: ["ui", "user"],

    async execute(message) {
        const splitMessage = splitContent(message);

        let user;
        let userAt;

        const buttons = makeButton();
        buttons.components[0].setDisabled(true);

        let response = await message.channel.send('...');

        let titleList = [];
        let titleDesc = [];

        if (splitMessage.length == 1) {
            user = await Users.findOne({ where: { user_id: message.author.id } });
            userAt = message.author;
        }
        else {
            user = await Users.findOne({ where: { user_id: message.mentions.users.first().id } });
            if (!user) { await response.edit(`${message.author}, that user either dosen't exist or is not registered.`); return; }
            userAt = message.mentions.users.first();
        }

        const userStat = await UserStats.findOne({ where: { user_id: user.user_id } });

        const userTitles = await UserTitles.findAll({ where: { user_id: user.user_id } });

        for (title of userTitles) {
            const titleData = await TitleDatabase.findOne({ where: { id: title.title_id } });
            
            titleList.push(`\`${titleData.name}\``);
            titleDesc.push(`**${titleData.name}:**\n\`\`\`${titleData.description}\`\`\``);
        }

        if (titleList.length == 0) {
            titleList.push('\`None\`')
            titleDesc.push(`\`No Titles\``)
        }

        await response.edit({ content: "", embeds: [makeEmbed(user, userAt, userStat, titleList)], components: [buttons] });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

        collector.on("collect", async i => {
            if (i.user.id != message.author.id) { i.deferUpdate(); return; }
            await i.deferUpdate();

            if (i.customId == "stats") {
                buttons.components[0].setDisabled(true);
                buttons.components[1].setDisabled(false);

                await response.edit({ content: "", embeds: [makeEmbed(user, userAt, userStat, titleList)], components: [buttons] });
            }
            else if (i.customId == "titles") {
                buttons.components[0].setDisabled(false);
                buttons.components[1].setDisabled(true);

                await response.edit({ content: "", embeds: [makeTitleEmbed(userAt, titleDesc)], components: [buttons] });
            }
        })
    }
}