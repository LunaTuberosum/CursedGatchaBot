const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, AttachmentBuilder, NewsChannel } = require("discord.js");
const { ServerInfo, Users, UserStats, CardDatabase, UserItems, ItemShop } = require('./dbObjects.js');
const raidJoin = require('./raid/raidJoin.js');
const { getWhichStar, makePokeImageDraw3, createCardID, checkSeriesCollect, formatName, makePokeImageDraw5 } = require("./pullingObjects.js");


let itemList = new Map();

function createItemList() {
    itemList.set("SMALL PACK", useDraw3);
    itemList.set("BIG PACK", useDraw5);
    itemList.set("GREAT BALL", useExtraGrab);
    itemList.set("RAIDING PASS", useRaidingPass);
    itemList.set("RAID LURE", useRaidLure);
}

function findItem(collection, itemName) {
    for (const item of collection) {
        if (item.item.name == itemName) {
            return item;
        }
    }
    return null;
}

function makeButton() {

    const cancelButton = new ButtonBuilder()
        .setCustomId("cancel")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("✖");

    const confirmButton = new ButtonBuilder()
        .setCustomId("confirm")
        .setStyle(ButtonStyle.Success)
        .setEmoji("✔")

    const row = new ActionRowBuilder()
        .addComponents(cancelButton, confirmButton);

    return row;
}

function makeDraw3Emebed(message, desc) {
    const embed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle("Small Pack Drawing")
        .setDescription(desc)
        .setImage(`attachment://poke-images.png`)

    return embed
}

function makeSmallButton() {

    const button = new ButtonBuilder()
        .setCustomId("next")
        .setStyle(ButtonStyle.Success)
        .setLabel("Reveal")

    const row = new ActionRowBuilder()
        .addComponents(button);

    return row;
}

async function useDraw3(message) {
    await _useDraw(message, "SMALL PACK", useDraw3After);
}

async function useDraw3After(message) {
    const response = await message.channel.send('Loading you pack...');
    const user = await Users.findOne({ where: { user_id: message.author.id } });
    const userStat = await UserStats.findOne({ where: { user_id: user.user_id } });

    let pokeDataList = [];
    let pokeItemList = [];

    // First two cards
    pokeDataList.push(getWhichStar("EVE1"));
    pokeItemList.push( await _getPokeItem(pokeDataList[0]));

    pokeDataList.push(getWhichStar("EVE1"));
    pokeItemList.push( await _getPokeItem(pokeDataList[1]));

    // Last Card
    pokeDataList.push(getWhichStar("EVE1", 61));
    pokeItemList.push( await _getPokeItem(pokeDataList[2]));

    let attachmentList = [];

    let canvasList = await makePokeImageDraw3(pokeDataList);
    for (let i = 0; i < 4; i++) {
        attachmentList.push(new AttachmentBuilder( await canvasList[i], { name: 'poke-images.png' }));
    }

    await response.edit({ content: ' ', embeds: [makeDraw3Emebed(message, 'Click \`Reveal\` to revel the cards one by one.')], components: [makeSmallButton()], files: [attachmentList[0]] });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

    collector.on("collect", async i => {
        if (i.user != message.author) { return }

        i.deferUpdate();
        if (i.customId == "next") {
            await response.edit({ embeds: [makeDraw3Emebed(message, `1. **${formatName(pokeItemList[0])}**\n2. ...\n3. ...`)], components: [], files: [attachmentList[1]] });
            if ((pokeItemList[0].series).substring(0, 3)) userStat.shiny_grabbed++;

            await response.edit({ embeds: [makeDraw3Emebed(message, `1. **${formatName(pokeItemList[0])}**\n2. **${formatName(pokeItemList[1])}**\n3. ...`)], components: [], files: [attachmentList[2]] });
            if ((pokeItemList[1].series).substring(0, 3)) userStat.shiny_grabbed++;

            setTimeout(async () => {
                await response.edit({ embeds: [makeDraw3Emebed(message, `1. **${formatName(pokeItemList[0])}**\n2. **${formatName(pokeItemList[1])}**\n3. **${formatName(pokeItemList[2])}**`)], components: [], files: [attachmentList[3]] });
                if ((pokeItemList[2].series).substring(0, 3)) userStat.shiny_grabbed++;

                let newCards = [];

                for (pokeItem of pokeItemList) {
                    pokeItem.in_circulation++;
                    pokeItem.save();

                    userStat.card_grabbed++;
                    userStat.save();

                    cardCode = await createCardID(user);
                    newCards.push(cardCode);
                    await user.addCard(cardCode, pokeItem);
                    
                    checkSeriesCollect(await user.getCards(), pokeDataList[0]["Series"], message);
                }

                await response.edit({ embeds: [makeDraw3Emebed(message, `1. **${formatName(pokeItemList[0])}** \`${newCards[0]}\`\n2. **${formatName(pokeItemList[1])}** \`${newCards[1]}\`\n3. **${formatName(pokeItemList[2])}** \`${newCards[2]}\``)], components: [], files: [attachmentList[3]] });
            }, "300");
        }
    });

    return 0;
}

function makeDraw5Emebed(message, desc) {
    const embed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle("Big Pack Drawing")
        .setDescription(desc)
        .setImage(`attachment://poke-images.png`)

    return embed
}

async function useDraw5(message) {
    await _useDraw(message, "BIG PACK", useDraw5After);
}

async function useDraw5After(message) {
    const response = await message.channel.send('Loading you pack...');
    const user = await Users.findOne({ where: { user_id: message.author.id } });
    const userStat = await UserStats.findOne({ where: { user_id: user.user_id } });

    let pokeDataList = [];
    let pokeItemList = [];

    // First two cards
    pokeDataList.push(getWhichStar("EVE1"));
    pokeItemList.push( await _getPokeItem(pokeDataList[0]));

    pokeDataList.push(getWhichStar("EVE1"));
    pokeItemList.push( await _getPokeItem(pokeDataList[1]));

    pokeDataList.push(getWhichStar("EVE1"));
    pokeItemList.push( await _getPokeItem(pokeDataList[2]));

    // Unccomon Card
    pokeDataList.push(getWhichStar("EVE1", 61));
    pokeItemList.push( await _getPokeItem(pokeDataList[3]));

    // Rare Card
    pokeDataList.push(getWhichStar("EVE1", 86));
    pokeItemList.push( await _getPokeItem(pokeDataList[4]));

    let attachmentList = [];

    let canvasList = await makePokeImageDraw5(pokeDataList);
    for (let i = 0; i < 6; i++) {
        attachmentList.push(new AttachmentBuilder( await canvasList[i], { name: 'poke-images.png' }));
    }

    await response.edit({ content: " ", embeds: [makeDraw5Emebed(message, 'Click \`Reveal\` to revel the cards one by one.')], components: [makeSmallButton()], files: [attachmentList[0]] });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

    collector.on("collect", async i => {
        if (i.user != message.author) { return }

        i.deferUpdate();
        if (i.customId == "next") {
            await response.edit({ embeds: [makeDraw5Emebed(message, `1. **${formatName(pokeItemList[0])}**\n2. ...\n3. ...\n 4. ...\n5. ...`)], components: [], files: [attachmentList[1]] });
            if ((pokeItemList[0].series).substring(0, 3)) userStat.shiny_grabbed++;

            await response.edit({ embeds: [makeDraw5Emebed(message, `1. **${formatName(pokeItemList[0])}**\n2. **${formatName(pokeItemList[1])}**\n3. ...\n 4. ...\n5. ...`)], components: [], files: [attachmentList[2]] });
            if ((pokeItemList[1].series).substring(0, 3)) userStat.shiny_grabbed++;

            await response.edit({ embeds: [makeDraw5Emebed(message, `1. **${formatName(pokeItemList[0])}**\n2. **${formatName(pokeItemList[1])}**\n3. **${formatName(pokeItemList[2])}**\n 4. ...\n5. ...`)], components: [], files: [attachmentList[3]] });
            if ((pokeItemList[2].series).substring(0, 3)) userStat.shiny_grabbed++;

            await response.edit({ embeds: [makeDraw5Emebed(message, `1. **${formatName(pokeItemList[0])}**\n2. **${formatName(pokeItemList[1])}**\n3. **${formatName(pokeItemList[2])}**\n 4. **${formatName(pokeItemList[3])}**\n5. ...`)], components: [], files: [attachmentList[4]] });
            if ((pokeItemList[3].series).substring(0, 3)) userStat.shiny_grabbed++;

            setTimeout(async () => {
                await response.edit({ embeds: [makeDraw5Emebed(message, `1. **${formatName(pokeItemList[0])}**\n2. **${formatName(pokeItemList[1])}**\n3. **${formatName(pokeItemList[2])}**\n 4. **${formatName(pokeItemList[3])}**\n5. **${formatName(pokeItemList[4])}**`)], components: [], files: [attachmentList[5]] });
                if ((pokeItemList[4].series).substring(0, 3)) userStat.shiny_grabbed++;

                let newCards = [];

                for (pokeItem of pokeItemList) {
                    pokeItem.in_circulation++;
                    pokeItem.save();

                    userStat.card_grabbed++;
                    userStat.save();

                    cardCode = await createCardID(user);
                    newCards.push(cardCode);
                    await user.addCard(cardCode, pokeItem);
                    
                    checkSeriesCollect(await user.getCards(), pokeDataList[0]["Series"], message);
                }

                await response.edit({ embeds: [makeDraw5Emebed(message, `1. **${formatName(pokeItemList[0])}** \`${newCards[0]}\`\n2. **${formatName(pokeItemList[1])}** \`${newCards[1]}\`\n3. **${formatName(pokeItemList[2])}** \`${newCards[2]}\`\n4. **${formatName(pokeItemList[3])}** \`${newCards[3]}\`\n5. **${formatName(pokeItemList[4])}** \`${newCards[4]}\``)], components: [], files: [attachmentList[5]] });
            }, "300");
        }
    });

    return 0;
}

function makeDrawUseEmbed(message, drawItemName) {
    const embed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Use ${drawItemName}`)
        .setDescription(`${message.author}, do you want to use a ${drawItemName}? \n\`\`\`Note: \n- Once used there is no way to cancel and the item will be used. \n- If you do not choose to reveal your cards you will not get them and you will have wasted your money.\`\`\``)

    return embed;
}

function makeDrawUseCancelEmbed(message, drawItemName) {
    const cancelEmbed = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setTitle(`Use ${drawItemName}`)
        .setDescription(`${message.author} canceled. \n\`\`\`Use has been canceled.\`\`\``)

    return cancelEmbed;
}

async function _useDraw(message, drawItemName, drawCommand) {
    const user = await Users.findOne({ where: { user_id: message.author.id } });
    if (!user) { await message.channel.send(`${message.author}, please register before tying to use an item. You can register using \`g!register\`.`); return; }

    const drawItem = await ItemShop.findOne({ where: { name: drawItemName }});
    const hasItem = await UserItems.findOne({ where: { user_id: user.user_id, item_id: drawItem.id } });
    if (!hasItem || hasItem.amount < 1) { message.channel.send(`${message.author}, you do not own that item. Please buy that item using \`g!buy ${drawItemName}\``); return; }

    const response = await message.channel.send({ embeds: [makeDrawUseEmbed(message, drawItemName)], components: [makeButton()] });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

    collector.on("collect", async i => {
        if (i.user != message.author) { return; }

        i.deferUpdate();
        if (i.customId == "confirm") {
            hasItem.amount--;
            hasItem.save();
            
            response.delete();
            drawCommand(message);

        } else if (i.customId == "cancel") {
            await response.edit({ embeds: [makeDrawUseCancelEmbed(message, drawItemName)], components: [] });
            
        }
    });
}

async function _getPokeItem(pokeData) {
    const pokeItem = await CardDatabase.findOne({ where: { card_id: pokeData["CardID"] || "001", series: pokeData["Series"] } });
    pokeItem.times_pulled++;
    pokeItem.save();

    return pokeItem;
}

async function useExtraGrab(message) {
    await message.channel.send({ content: `${message.author}, the GREAT BALL item is used when you attept to grab a card while your on cooldown. You can not use it on its own.` })
    return 0;
}

async function useRaidingPass(message) {
    await message.channel.send({ content: `${message.author}, the RAIDING PASS item is used when you click to join a raid. You can not use it on its own.` })
    return 0;
}


function makeRaidLureEmbed(message) {

    const raidLureEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Use Raid Lure`)
        .setDescription(`${message.author}, do you want to use a RAID LURE? \n\`\`\`Note: \n- A RAID LURE will spawn a random difficulty RAID. \n- You are not required to join a RAID you start. \n- No bonuses will be given to you for starting a RAID.\`\`\``)

    return raidLureEmbed;
}

function makeRaidLureCanceledEmbed(message) {

    const raidLureEmbed = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setTitle(`Use Raid Lure`)
        .setDescription(`${message.author}, canceled. \n\`\`\`Canceled use of RAID LURE.\`\`\``)

    return raidLureEmbed;
}

function makeRaidLureConfirmEmbed(message) {

    const raidLureEmbed = new EmbedBuilder()
        .setColor("#26bd0f")
        .setTitle(`Use Raid Lure`)
        .setDescription(`${message.author}, get ready. \n\`\`\`RAID LURE used. RAID will beign soon.\`\`\``)

    return raidLureEmbed;
}

async function useRaidLure(message) {
    return;
    const server = await ServerInfo.findOne({ where: { server_id: message.guild.id, raid_channel: message.channel.id } });
    
    if (!server) {
        await message.channel.send(`${message.author}, you can't start raids in this channel.`);
        return;
    }

    const response = await message.channel.send({ content: "", embeds: [makeRaidLureEmbed(message)], components: [makeButton()] });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

    collector.on("collect", async i => {
        if (i.user == message.author) {
            i.deferUpdate();
            if (i.customId == "cancel") {
                await response.edit({ embeds: [makeRaidLureCanceledEmbed(message)], components: [] });
                return;
            }
            else if (i.customId == "confirm") {
                const user = await Users.findOne({ where : { user_id: message.author.id } });
                const userItems = await user.getItems();
                const userItemData = findItem(userItems, "RAID LURE");
                userItemData.amount -= 1;
                userItemData.save()

                await response.edit({ embeds: [makeRaidLureConfirmEmbed(message)], components: [] });
                await raidJoin.execute(message);
                return;
            };
        };
    });

}


async function getItemUse(itemName, message) {
    
    try {
        await itemList.get(itemName)(message);
        return
    }
    catch {
        await message.channel.send({ content: `${message.author}, that item does not have a use.` });
        return;
    };
}

module.exports = ({ getItemUse, createItemList })