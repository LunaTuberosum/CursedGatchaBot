const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { Users, EventShop } = require('../../dbObjects.js');

function makeShopEmbed(shopArray, start, end, total, curEvent) {

    const invEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`EVENT SHOP [GET PAINTBRUSHES FROM GRABING CARDS]`)
        .setDescription(`Use \`g!buy "item name" #\` to buy\n\n${shopArray.join("\n")}`)
        .setFooter({ text: `Showing items ${start}-${end} of ${total}`})

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

function checkButtons(buttons, start, end, length) {
    buttons.components[0].setDisabled(false);
    buttons.components[1].setDisabled(false);
    if (start == 1) {
        buttons.components[0].setDisabled(true);
    }
    else if (end == length) {
        buttons.components[1].setDisabled(true);
    }
}

async function getArray(shopItems, start, end) {
    
    let i = 1;
    shopArray = []
    for (const item of shopItems) {
        
        if (item.cost == 0) continue;
        if (i > end) {
            return shopArray;
        }
        else if(i >= start) {
            shopArray.push(`${item.emoji} **${item.name}** [${item.event}]\n*${item.description}*\n\`\`\`- ${item.cost} ${item.itemCost}\`\`\``);
        }
        i++;
    }
    return shopArray;
}

function getLength(shopData) {
    let length = 1;
    for (const item of shopData) {
        if (item.cost != 0) length += 1
    }
    return length;
}

module.exports = {
    name: "eventShop",
    shortName: ["es", "eshop"],
        
    async execute(message) {
        const shopData = await EventShop.findAll();
        const curEvent = "CRAP"

        let start = 1;
        let end = 5;

        let shopArray = await getArray(shopData, start, end);
        let length = getLength(shopData);
        
        const buttons = makeButton()
        const response = await message.channel.send({ embeds: [makeShopEmbed(shopArray, start, end, length - 1, curEvent)], components: [buttons] });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

            collector.on("collect", async i => {
                await i.deferUpdate();
                if (i.user != message.author) { return; }
                collector.resetTimer();

                if (i.customId == "left") {
                    start = Math.max(start - 5, 1);
                    end = Math.max(end - 5, 5);
                    checkButtons(buttons, start, end, length);

                    shopArray = await getArray(shopData, start, end);
                    await response.edit({ embeds: [makeShopEmbed(shopArray, start, end, length - 1, curEvent)], components: [buttons] });

                }
                else if (i.customId == "right") {
                    start = Math.min(start + 5, length - 5);
                    end = Math.min(end + 5, length - 1);
                    checkButtons(buttons, start, end, length);

                    shopArray = await getArray(shopData, start, end);
                    await response.edit({ embeds: [makeShopEmbed(shopArray, start, end, length - 1, curEvent)], components: [buttons] });
                }
        });
    }

};