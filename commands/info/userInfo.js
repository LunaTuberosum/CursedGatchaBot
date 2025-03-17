const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { Users, UserStats, UserTitles, TitleDatabase } = require("../../dbObjects");
const { splitContent } = require("../../commandObjects");

function makeEmbed(user, userAt, userStat, titleList) {
    const embed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle("User Stats")
        .setDescription(`**User:** ${userAt}\n**Titles:** ${titleList.join(", ")}\n\n📚 **Cards:**\nCards Released: \`${userStat.card_released}\`\nCards Pulled: \`${userStat.card_drawn}\`\nCards Grabbed: \`${userStat.card_grabbed}\`\nShinys Grabbed: \`${userStat.shiny_grabbed}\`\n\n🪙 **Shop:**\nMoney Spent: \`${userStat.money_spent}\`\nMoney Own: \`${userStat.money_own}\``)
    return embed
}

function makeTitleEmbed(userAt, titleDesc, start, end, total) {
    const embed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle("User Stats - Titles")
        .setDescription(`**User:** ${userAt}\n\n${titleDesc.join("\n")}`)
        .setFooter({ text: `Showing titles ${start + 1}-${end} of ${total}`})
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

function makeArrowButton() {

    const leftButton = new ButtonBuilder()
        .setCustomId("left")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("◀️")
        .setDisabled(true);

    const rightButton = new ButtonBuilder()
        .setCustomId("right")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("▶️");

    const row = new ActionRowBuilder()
        .addComponents(leftButton, rightButton);

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

        const arrowButtons = makeArrowButton();

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

        let start = 0;
        let end = Math.min(5, userTitles.length);

        let index = 0;
        for (title of userTitles) {
            const titleData = await TitleDatabase.findOne({ where: { id: title.title_id } });
            
            if (index == 5) titleList.push(`\`...\``);
            if (index >= 5) null;
            else titleList.push(`\`${titleData.name}\``);

            if (index < end) titleDesc.push(`**${titleData.name}:**\n\`\`\`${titleData.description}\`\`\``);
            index++;
        }

        if (titleList.length == 0) {
            titleList.push('\`None\`')
            titleDesc.push(`\`No Titles\``)
        }

        await response.edit({ content: "", embeds: [makeEmbed(user, userAt, userStat, titleList)], components: [buttons] });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

        collector.on("collect", async i => {
            await i.deferUpdate();
            if (i.user.id != message.author.id) { return; }
            collector.resetTimer();

            if (i.customId == "stats") {
                buttons.components[0].setDisabled(true);
                buttons.components[1].setDisabled(false);

                if (start = 0) arrowButtons.components[0].setDisabled(true);
                else arrowButtons.components[0].setDisabled(false);
                if (end = titleList.length) arrowButtons.components[1].setDisabled(true);
                else arrowButtons.components[1].setDisabled(false);

                await response.edit({ content: "", embeds: [makeEmbed(user, userAt, userStat, titleList)], components: [buttons] });
            }
            else if (i.customId == "titles") {
                buttons.components[0].setDisabled(false);
                buttons.components[1].setDisabled(true);

                start = 0;
                end = Math.min(5, userTitles.length);
                titleDesc = [];

                index = 0;
                for (title of userTitles) {
                    const titleData = await TitleDatabase.findOne({ where: { id: title.title_id } });

                    if (index >= start && index < end) titleDesc.push(`**${titleData.name}:**\n\`\`\`${titleData.description}\`\`\``);
                    else if (index >= end) break;
                    index++;
                }

                arrowButtons.components[0].setDisabled(true);
                arrowButtons.components[1].setDisabled(false);
                
                await response.edit({ content: "", embeds: [makeTitleEmbed(userAt, titleDesc, start, end, userTitles.length)], components: [buttons, arrowButtons] });
            }
            else if (i.customId == "right") {
                start += 5;
                end = Math.min(end + 5, userTitles.length);
                titleDesc = [];                

                index = 0;
                for (title of userTitles) {
                    const titleData = await TitleDatabase.findOne({ where: { id: title.title_id } });

                    if (index >= start && index < end) titleDesc.push(`**${titleData.name}:**\n\`\`\`${titleData.description}\`\`\``);
                    else if (index >= end) break;
                    index++;
                }
                if (start == 0) arrowButtons.components[0].setDisabled(true);
                else arrowButtons.components[0].setDisabled(false);

                if (end == userTitles.length) arrowButtons.components[1].setDisabled(true);
                else arrowButtons.components[1].setDisabled(false);

                await response.edit({ content: "", embeds: [makeTitleEmbed(userAt, titleDesc, start, end, userTitles.length)], components: [buttons, arrowButtons] });
            }
            else if (i.customId == "left") {
                start = Math.max(0, start - 5);
                end = Math.max(end - 5, 5);
                titleDesc = [];                

                index = 0;
                for (title of userTitles) {
                    const titleData = await TitleDatabase.findOne({ where: { id: title.title_id } });

                    if (index >= start && index < end) titleDesc.push(`**${titleData.name}:**\n\`\`\`${titleData.description}\`\`\``);
                    else if (index >= end) break;
                    index++;
                }
                if (start == 0) arrowButtons.components[0].setDisabled(true);
                else arrowButtons.components[0].setDisabled(false);

                if (end == userTitles.length) arrowButtons.components[1].setDisabled(true);
                else arrowButtons.components[1].setDisabled(false);

                await response.edit({ content: "", embeds: [makeTitleEmbed(userAt, titleDesc, start, end, userTitles.length)], components: [buttons, arrowButtons] });
            }
        })
    }
}