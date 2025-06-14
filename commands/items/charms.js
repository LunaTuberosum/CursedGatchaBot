const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { Users } = require('../../dbObjects.js');

function makeCharmEmbed(invArray, user, start, end, total) {

    const invEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Charms`)
        .setDescription(`Charms held by ${user}\n \
        ${invArray.join("")}`)
        .setFooter({ text: `Showing charms ${start}-${end} of ${total}`})

    return invEmbed;
}

function makeCharmEmbedEmpty(user) {

    const invEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Charms`)
        .setDescription(`Charms held by ${user}\n \
        \n \
        **You have no charms.**`)
        .setFooter({ text: `Showing charms 0-0 of 0`})

    return invEmbed;
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

function getArray(userItems, start, end) {
    let i = 1;
    invArray = []
    for (const item of userItems) {
        if (i > end) {
            break;
        }
        else if(i >= start) {
            invArray.push(`\n${item.item.emoji} **${item.amount}** - \`${item.item.name}\` ${item.item.event ? `[${item.item.event}]` : ""}`);
        }
        i++;2
    }

    return invArray;
}

function checkButtons(buttons, start, end, userItems) {
    buttons.components[0].setDisabled(false);
    buttons.components[1].setDisabled(false);
    if (start == 1) {
        buttons.components[0].setDisabled(true);
    }
    else if (end == userItems.length) {
        buttons.components[1].setDisabled(true);
    }
}

module.exports = {
    name: "charms",
    shortName: ["c"],
        
    async execute(message) {

        const user = await Users.findOne({ where: { user_id: message.author.id } });
        if (!user) { await message.channel.send(`${message.author}, you are not registered. Please register using \`g!register\`.`); return; }

        const userCharms = await user.getCharms();

        if (userCharms.length == 0) {
            message.channel.send({ embeds: [makeCharmEmbedEmpty(message.author)] });
            return;
        }
        if (userCharms.length > 10) {
            let charmArray = getArray(userCharms, 1, 10);

            let start = 1;
            let end = 10;

            const buttons = makeButton();
            const response = await message.channel.send({ embeds: [makeCharmEmbed(charmArray, message.author, start, end, userCharms.length)], components: [buttons] });

            const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

            collector.on("collect", async i => {
                await i.deferUpdate();

                if (i.user != message.author) { return; }
                collector.resetTimer();
                
                if (i.customId == "left") {
                    start = Math.max(start - 10, 1);
                    end = Math.max(end - 10, 10);
                    checkButtons(buttons, start, end, userCharms);

                    charmArray = getArray(userCharms, start, end);
                    await response.edit({ embeds: [makeCharmEmbed(charmArray, message.author, start, end, userCharms.length)], components: [buttons] });

                }
                else if (i.customId == "right") {
                    start = Math.min(start + 10, userCharms.length - 9);
                    end = Math.min(end + 10, userCharms.length);
                    checkButtons(buttons, start, end, userCharms);

                    charmArray = getArray(userCharms, start, end);
                    await response.edit({ embeds: [makeCharmEmbed(charmArray, message.author, start, end, userCharms.length)], components: [buttons] });
                }
            });
        }
        else {
            
            charmArray = []
            for (const item of userCharms) {

                charmArray.push(`\n${item.item.emoji} **${item.amount}** - \`${item.item.name}\``);
            }
            
            message.channel.send({ embeds: [makeCharmEmbed(charmArray, message.author, 1, userCharms.length, userCharms.length)] });
        }
    },
};