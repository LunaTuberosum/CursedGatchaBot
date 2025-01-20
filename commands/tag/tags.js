const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { Users, Tags, UserCards } = require('../../dbObjects.js');
const tagCreate = require("./tagCreate.js");

function makeTagsEmbed(tagArray, user, start, end, total) {

    const tagsEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Tags`)
        .setDescription(`User: ${user}\n${tagArray.join("")}`)
        .setFooter({ text: `Showing tags ${start}-${end} of ${total}`})

    return tagsEmbed;
}

function makeTagsEmbedEmpty(user) {

    const tagsEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Tags`)
        .setDescription(`User: ${user}\n\n**You have made no tags.**`)
        .setFooter({ text: `Showing tags 0-0 of 0`})

    return tagsEmbed;
}

function makeButton() {

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

async function getArray(userTags, start, end, user) {
    let i = 1;
    tagArray = []
    for (const tag of userTags) {
        if (i > end) {
            break;
        }
        else if(i >= start) {
            tagNum = await UserCards.findAll({ where:{ user_id: user || null, tag: tag.name } })
            tagArray.push(`\n${tag.emoji} \`${tag.name}\` - **${tagNum.length}** cards`);
        }
        i++;
    }

    return tagArray;
}

function checkButtons(buttons, start, end, userTags) {
    buttons.components[0].setDisabled(false);
    buttons.components[1].setDisabled(false);
    if (start == 1) {
        buttons.components[0].setDisabled(true);
    }
    else if (end == userTags.length) {
        buttons.components[1].setDisabled(true);
    }
}

module.exports = {
    name: "tags",
        
    async execute(message) {

        const user = await Users.findOne({ where: { user_id: message.author.id } });
        if (!user) {
            message.channel.send({ embeds: [makeTagsEmbedEmpty(message.author)] });
            return;
        }
        const userTags = await Tags.findAll({ where: { user_id: message.author.id } });

        if (userTags.length == 0) {
            message.channel.send({ embeds: [makeTagsEmbedEmpty(message.author)] });
        }
        else {

            if (userTags.length > 10) {
                let tagArray = await getArray(userTags, 1, 10, message.author.id);

                let start = 1;
                let end = 10;

                const buttons = makeButton();
                const response = await message.channel.send({ embeds: [makeTagsEmbed(tagArray, message.author, start, end, userTags.length)], components: [buttons] });

                const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

                collector.on("collect", async i => {

                    if (i.user == message.author) {
                        await i.deferUpdate();
                        if (i.customId == "left") {
                            if (start - 10 < 1) {
                                start = 1;
                                end = 10;
                            }
                            else {
                                start -= 10;
                                end -= 10;
                            }
                            checkButtons(buttons, start, end, userTags);

                            tagArray = await getArray(userTags, start, end, message.author.id);
                            await response.edit({ embeds: [makeTagsEmbed(tagArray, message.author, start, end, userTags.length)], components: [buttons] });

                        }
                        else if (i.customId == "right") {
                            if (end + 10 > userTags.length) {
                                start += userTags.length - end;
                                end = userTags.length;
                            }
                            else {
                                start += 10;
                                end += 10;
                            }
                            checkButtons(buttons, start, end, userTags);

                            tagArray = await getArray(userTags, start, end, message.author.id);
                            await response.edit({ embeds: [makeTagsEmbed(tagArray, message.author, start, end, userTags.length)], components: [buttons] });
                        }
                    }
                    
                    

                });
            }
            else {
                
                tagArray = []
                for (const tag of userTags) {

                    tagNum = await UserCards.findAll({ where:{ user_id: message.author.id, tag: tag.name } })
                    tagArray.push(`\n${tag.emoji} \`${tag.name}\` - **${tagNum.length}** cards`);
                }
                
                message.channel.send({ embeds: [makeTagsEmbed(tagArray, message.author, 1, userTags.length, userTags.length)] });
            }

        }
    },
};