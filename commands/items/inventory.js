const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { Users } = require('../../dbObjects.js');

function makeInvEmbed(invArray, user, start, end, total) {

    const invEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Inventory`)
        .setDescription(`Items held by ${user}\n \
        ${invArray.join("")}`)
        .setFooter({ text: `Showing items ${start}-${end} of ${total}`})

    return invEmbed;
}

function makeInvEmbedEmpty(user) {

    const invEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Inventory`)
        .setDescription(`Items held by ${user}\n \
        \n \
        **You have no items.**`)
        .setFooter({ text: `Showing items 0-0 of 0`})

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
            invArray.push(`\n${item.item.emoji} **${item.amount}** - \`${item.item.name}\``);
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
    name: "inventory",
    shortName: ["i", "inv"],
        
    async execute(message) {

        const user = await Users.findOne({ where: { user_id: message.author.id } });
        if (!user) {
            message.channel.send({ embeds: [makeInvEmbedEmpty(message.author)] });
            return;
        }
        const userItems = await user.getItems();

        if (userItems.length == 0) {
            message.channel.send({ embeds: [makeInvEmbedEmpty(message.author)] });
            return;
        }
        if (userItems.length > 10) {
            let invArray = getArray(userItems, 1, 10);

            let start = 1;
            let end = 10;

            const buttons = makeButton();
            const response = await message.channel.send({ embeds: [makeInvEmbed(invArray, message.author, start, end, userItems.length)], components: [buttons] });

            const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

            collector.on("collect", async i => {

                if (i.user == message.author) {
                    if (i.customId == "left") {
                        start = Math.max(start - 10, 1);
                        end = Math.max(end - 10, 10);
                        checkButtons(buttons, start, end, userItems);

                        invArray = getArray(userItems, start, end);
                        await response.edit({ embeds: [makeInvEmbed(invArray, message.author, start, end, userItems.length)], components: [buttons] });
                        i.deferUpdate();

                    }
                    else if (i.customId == "right") {
                        start = Math.min(start + 10, userItems.length - 9);
                        end = Math.min(end + 10, userItems.length);
                        checkButtons(buttons, start, end, userItems);

                        invArray = getArray(userItems, start, end);
                        await response.edit({ embeds: [makeInvEmbed(invArray, message.author, start, end, userItems.length)], components: [buttons] });
                        i.deferUpdate();
                    }
                }
                
            });
        }
        else {
            
            invArray = []
            for (const item of userItems) {

                invArray.push(`\n${item.item.emoji} **${item.amount}** - \`${item.item.name}\``);
            }
            
            message.channel.send({ embeds: [makeInvEmbed(invArray, message.author, 1, userItems.length, userItems.length)] });
        }
    },
};