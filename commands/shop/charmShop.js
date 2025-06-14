const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { Users, CharmShop } = require('../../dbObjects.js');

function makeShopEmbed(shopArray, start, end, total) {

    const invEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`CHARM SHOP`)
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
    else if (end >= length - 1) {
        buttons.components[1].setDisabled(true);
    }
}

async function getArray(shopItems, start, end) {
    
    let i = 1;
    shopArray = []
    for (const item of shopItems) {
        
        if (item.event != "None") continue;
        if (i > end) {
            return shopArray;
        }
        else if(i >= start) {
            let text = `${item.emoji} **${item.name}**\n*${item.description}*\n\`\`\``
            if (item.gemCost > 0) text += `\n- ${item.gemCost} ${item.gemName} GEM`
            if (item.shardCost > 0) text += `\n- ${item.shardCost} ${item.shardName} SHARD`
            if (item.itemCost > 0) text += `\n- ${item.itemCost} ${item.itemName}`
            text += '```'
            shopArray.push(text);
        }
        i++;
    }
    return shopArray;
}

function getLength(shopData) {
    let length = 0;
    for (const item of shopData) {
        if (item.cost != 0) length += 1
    }
    return length;
}

module.exports = {
    name: "charmShop",
    shortName: ["cs", "charm"],
        
    async execute(message) {
        const shopData = await CharmShop.findAll();
        let length = getLength(shopData)

        let start = 1;
        let end = Math.min(5, length);

        let shopArray = await getArray(shopData, start, end)

        let embed = makeShopEmbed(shopArray, start, end, length)

        let buttons = makeButton()
        if (end == length) buttons.components[1].setDisabled(true);

        const response = await message.channel.send({ embeds: [embed], components: [buttons] });

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
                    await response.edit({ embeds: [makeShopEmbed(shopArray, start, end, length, curEvent)], components: [buttons] });

                }
                else if (i.customId == "right") {
                    start = Math.min(start + 5, length - 5);
                    end = Math.min(end + 5, length);
                    checkButtons(buttons, start, end, length);

                    shopArray = await getArray(shopData, start, end);
                    await response.edit({ embeds: [makeShopEmbed(shopArray, start, end, length, curEvent)], components: [buttons] });
                }
        });
    }
}