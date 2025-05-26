const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, AttachmentBuilder, NewsChannel } = require("discord.js");
const { ServerInfo, Users, UserStats, CardDatabase, UserItems, ItemShop, EventShop, UserEventItems, TitleDatabase, UserTitles, Wishlists } = require('./dbObjects.js');
const raidJoin = require('./raid/raidJoin.js');
const { getWhichStar, makePokeImageDraw3, createCardID, makePokeImagePull, checkSeriesCollect, formatName, makePokeImageDraw5, getWhichStarEvent, makePokeImageGrab, checkPullTitles, checkGrabTitles } = require("./pullingObjects.js");

// Make Item List

let itemList = new Map();

function createItemList() {
    itemList.set("SMALL PACK", useDraw3);
    itemList.set("BIG PACK", useDraw5);
    itemList.set("GREAT BALL", useExtraGrab);
    itemList.set("RAIDING PASS", useRaidingPass);
    itemList.set("RAID LURE", useRaidLure);

    // EVENT
    itemList.set("CARD GRAB", useCardGrab);
    itemList.set("EVENT PULL", useSpecialPull);
    itemList.set("BIG PACK EV", useDraw5Event);
    itemList.set("SMALL PACK EV", useDraw3Event);

}

// BUTTON FUNCTIONS

function makeSmallButton() {

    const button = new ButtonBuilder()
        .setCustomId("next")
        .setStyle(ButtonStyle.Success)
        .setLabel("Reveal")

    const row = new ActionRowBuilder()
        .addComponents(button);

    return row;
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

function makeNumButton() {

    const card1Button = new ButtonBuilder()
        .setCustomId('card1')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('1️⃣');

    const card2Button = new ButtonBuilder()
        .setCustomId('card2')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('2️⃣');

    const row = new ActionRowBuilder()
        .addComponents(card1Button, card2Button);

    return row;
}

// HELPER FUNCTIONS

async function _getPokeItem(pokeData) {
    const pokeItem = await CardDatabase.findOne({ where: { card_id: pokeData["CardID"] || "001", series: pokeData["Series"], card_type: pokeData["CardType"] } });
    pokeItem.times_pulled++;
    pokeItem.save();

    return pokeItem;
}

// DRAW 3 EMBED

function makeDraw3Emebed(message, desc) {
    const embed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle("Small Pack Drawing")
        .setDescription(desc)
        .setImage(`attachment://poke-images.png`)

    return embed
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
            if ((pokeItemList[0].series).substring(0, 3) == "SHY") userStat.shiny_grabbed++;

            await response.edit({ embeds: [makeDraw3Emebed(message, `1. **${formatName(pokeItemList[0])}**\n2. **${formatName(pokeItemList[1])}**\n3. ...`)], components: [], files: [attachmentList[2]] });
            if ((pokeItemList[1].series).substring(0, 3) == "SHY") userStat.shiny_grabbed++;

            setTimeout(async () => {
                await response.edit({ embeds: [makeDraw3Emebed(message, `1. **${formatName(pokeItemList[0])}**\n2. **${formatName(pokeItemList[1])}**\n3. **${formatName(pokeItemList[2])}**`)], components: [], files: [attachmentList[3]] });
                if ((pokeItemList[2].series).substring(0, 3) == "SHY") userStat.shiny_grabbed++;

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

// DRAW 3 EVENT

async function useDraw3Event(message) {
    await _useDrawEvent(message, `SMALL PACK EV`, useDraw3EventAfter);
}

async function useDraw3EventAfter(message) {
    const response = await message.channel.send('Loading you pack...');
    const user = await Users.findOne({ where: { user_id: message.author.id } });
    const userStat = await UserStats.findOne({ where: { user_id: user.user_id } });

    const eventItem = await EventShop.findOne({ where: { name: "BIG PACK EV" } });

    let pokeDataList = [];
    let pokeItemList = [];

    // First two cards
    pokeDataList.push(getWhichStarEvent(eventItem.event));
    pokeItemList.push( await _getPokeItem(pokeDataList[0]));

    pokeDataList.push(getWhichStarEvent(eventItem.event));
    pokeItemList.push( await _getPokeItem(pokeDataList[1]));

    // Last Card
    pokeDataList.push(getWhichStarEvent(eventItem.event, 61));
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
            if ((pokeItemList[0].series).substring(0, 3) == "SHY") userStat.shiny_grabbed++;

            await response.edit({ embeds: [makeDraw3Emebed(message, `1. **${formatName(pokeItemList[0])}**\n2. **${formatName(pokeItemList[1])}**\n3. ...`)], components: [], files: [attachmentList[2]] });
            if ((pokeItemList[1].series).substring(0, 3) == "SHY") userStat.shiny_grabbed++;

            setTimeout(async () => {
                await response.edit({ embeds: [makeDraw3Emebed(message, `1. **${formatName(pokeItemList[0])}**\n2. **${formatName(pokeItemList[1])}**\n3. **${formatName(pokeItemList[2])}**`)], components: [], files: [attachmentList[3]] });
                if ((pokeItemList[2].series).substring(0, 3) == "SHY") userStat.shiny_grabbed++;

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

// DRAW 5 EMEBED

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
            if ((pokeItemList[0].series).substring(0, 3) == "SHY") userStat.shiny_grabbed++;

            await response.edit({ embeds: [makeDraw5Emebed(message, `1. **${formatName(pokeItemList[0])}**\n2. **${formatName(pokeItemList[1])}**\n3. ...\n 4. ...\n5. ...`)], components: [], files: [attachmentList[2]] });
            if ((pokeItemList[1].series).substring(0, 3) == "SHY") userStat.shiny_grabbed++;

            await response.edit({ embeds: [makeDraw5Emebed(message, `1. **${formatName(pokeItemList[0])}**\n2. **${formatName(pokeItemList[1])}**\n3. **${formatName(pokeItemList[2])}**\n 4. ...\n5. ...`)], components: [], files: [attachmentList[3]] });
            if ((pokeItemList[2].series).substring(0, 3) == "SHY") userStat.shiny_grabbed++;

            await response.edit({ embeds: [makeDraw5Emebed(message, `1. **${formatName(pokeItemList[0])}**\n2. **${formatName(pokeItemList[1])}**\n3. **${formatName(pokeItemList[2])}**\n 4. **${formatName(pokeItemList[3])}**\n5. ...`)], components: [], files: [attachmentList[4]] });
            if ((pokeItemList[3].series).substring(0, 3) == "SHY") userStat.shiny_grabbed++;

            setTimeout(async () => {
                await response.edit({ embeds: [makeDraw5Emebed(message, `1. **${formatName(pokeItemList[0])}**\n2. **${formatName(pokeItemList[1])}**\n3. **${formatName(pokeItemList[2])}**\n 4. **${formatName(pokeItemList[3])}**\n5. **${formatName(pokeItemList[4])}**`)], components: [], files: [attachmentList[5]] });
                if ((pokeItemList[4].series).substring(0, 3) == "SHY") userStat.shiny_grabbed++;

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

// DRAW 5 EVENT

async function useDraw5Event(message) {
    await _useDrawEvent(message, `BIG PACK EV`, useDraw5EventAfter);
}

async function useDraw5EventAfter(message) {
    const response = await message.channel.send('Loading you pack...');
    const user = await Users.findOne({ where: { user_id: message.author.id } });
    const userStat = await UserStats.findOne({ where: { user_id: user.user_id } });

    const eventItem = await EventShop.findOne({ where: { name: "BIG PACK EV" } });

    let pokeDataList = [];
    let pokeItemList = [];

    // First two cards
    pokeDataList.push(getWhichStarEvent(eventItem.event));
    pokeItemList.push( await _getPokeItem(pokeDataList[0]));

    pokeDataList.push(getWhichStarEvent(eventItem.event));
    pokeItemList.push( await _getPokeItem(pokeDataList[1]));

    pokeDataList.push(getWhichStarEvent(eventItem.event));
    pokeItemList.push( await _getPokeItem(pokeDataList[2]));

    // Unccomon Card
    pokeDataList.push(getWhichStarEvent(eventItem.event, 61));
    pokeItemList.push( await _getPokeItem(pokeDataList[3]));

    // Rare Card
    pokeDataList.push(getWhichStarEvent(eventItem.event, 86));
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
            if ((pokeItemList[0].series).substring(0, 3) == "SHY") userStat.shiny_grabbed++;

            await response.edit({ embeds: [makeDraw5Emebed(message, `1. **${formatName(pokeItemList[0])}**\n2. **${formatName(pokeItemList[1])}**\n3. ...\n 4. ...\n5. ...`)], components: [], files: [attachmentList[2]] });
            if ((pokeItemList[1].series).substring(0, 3) == "SHY") userStat.shiny_grabbed++;

            await response.edit({ embeds: [makeDraw5Emebed(message, `1. **${formatName(pokeItemList[0])}**\n2. **${formatName(pokeItemList[1])}**\n3. **${formatName(pokeItemList[2])}**\n 4. ...\n5. ...`)], components: [], files: [attachmentList[3]] });
            if ((pokeItemList[2].series).substring(0, 3) == "SHY") userStat.shiny_grabbed++;

            await response.edit({ embeds: [makeDraw5Emebed(message, `1. **${formatName(pokeItemList[0])}**\n2. **${formatName(pokeItemList[1])}**\n3. **${formatName(pokeItemList[2])}**\n 4. **${formatName(pokeItemList[3])}**\n5. ...`)], components: [], files: [attachmentList[4]] });
            if ((pokeItemList[3].series).substring(0, 3) == "SHY") userStat.shiny_grabbed++;

            setTimeout(async () => {
                await response.edit({ embeds: [makeDraw5Emebed(message, `1. **${formatName(pokeItemList[0])}**\n2. **${formatName(pokeItemList[1])}**\n3. **${formatName(pokeItemList[2])}**\n 4. **${formatName(pokeItemList[3])}**\n5. **${formatName(pokeItemList[4])}**`)], components: [], files: [attachmentList[5]] });
                if ((pokeItemList[4].series).substring(0, 3) == "SHY") userStat.shiny_grabbed++;

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

// DRAW USE EMEBEDS

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

async function _useDrawEvent(message, drawItemName, drawCommand) {
    const user = await Users.findOne({ where: { user_id: message.author.id } });
    if (!user) { await message.channel.send(`${message.author}, please register before tying to use an item. You can register using \`g!register\`.`); return; }

    const eventItem = await EventShop.findOne({ where: { name: drawItemName }});
    const hasItem = await UserItems.findOne({ where: { user_id: user.user_id, item_id: eventItem.id } });
    if (!hasItem || hasItem.amount < 1) { message.channel.send(`${message.author}, you do not own that item. Please buy that item using \`g!buy ${drawItemName}\``); return; }

    const response = await message.channel.send({ embeds: [makeDrawUseEmbed(message, `${drawItemName} [${eventItem.event}]`)], components: [makeButton()] });

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
            await response.edit({ embeds: [makeDrawUseCancelEmbed(message, `${drawItemName} [${eventItem.event}]`)], components: [] });
            
        }
    });
}

// USE EXTRA GRAB

async function useExtraGrab(message) {
    await message.channel.send({ content: `${message.author}, the GREAT BALL item is used when you attept to grab a card while your on cooldown. You can not use it on its own.` })
    return 0;
}

// RAID LURE

function findItem(collection, itemName) {
    for (const item of collection) {
        if (item.item.name == itemName) {
            return item;
        }
    }
    return null;
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

// CARD GRAB

function makeCardGrabEmbed(message, event) {

    const cardGrabEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Use CARD GRAB [${event}]`)
        .setDescription(`${message.author}, do you want to use a CARD GRAB? \n\`\`\`Note: \n- Once used there is no way to cancel and the item will be used. \n- If you do not choose to reveal your cards. you will not get them and you will have wasted your event items.\`\`\``)

    return cardGrabEmbed;
}

function makeCardGrabCanceledEmbed(message, event) {

    const cardGrabEmbed = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setTitle(`Use CARD GRAB [${event}]`)
        .setDescription(`${message.author}, canceled. \n\`\`\`Canceled use of CARD GRAB.\`\`\``)

    return cardGrabEmbed;
}

async function useCardGrab(message) {
    const response = await message.channel.send("Loading your grab...");

    const user = await Users.findOne({ where: { user_id: message.author.id } });
    if (!user) { await response.edit(`${message.author}, please register before tying to use an item. You can register using \`g!register\`.`); return; }

    const drawItem = await EventShop.findOne({ where: { name: "CARD GRAB" }});
    const hasItem = await UserEventItems.findOne({ where: { user_id: user.user_id, item_id: drawItem.id } });

    if (!hasItem) { await response.edit(`${message.author}, you do not own a CARD GRAB. Please use \`g!buy CARD GRAB\` to buy one.`); return; }

    await response.edit({ content: "", embeds: [makeCardGrabEmbed(message, drawItem.event)], components: [makeButton()] });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

    collector.on("collect", async i => {
        if (i.user != message.author) { return; }

        i.deferUpdate();
        if (i.customId == "confirm") {
            hasItem.amount--;
            hasItem.save();
            
            response.delete();
            useCardGrabAfter(message, user, drawItem);

        } else if (i.customId == "cancel") {
            await response.edit({ content: "", embeds: [makeCardGrabCanceledEmbed(message, drawItem.event)], components: [] });
            
        }
    });
}

function makeCardGrabShowEmbed(message, item, desc) {
    const embed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Card Grab [${item.event}] Drawing`)
        .setDescription(desc)
        .setImage(`attachment://poke-image.png`)

    return embed
}

async function useCardGrabAfter(message, user, item) {
    const response = await message.channel.send('Loading you pack...');
    const userStat = await UserStats.findOne({ where: { user_id: user.user_id } });

    const pokeData = getWhichStarEvent(item.event);
    const pokeItem = await _getPokeItem(pokeData);

    const canvasList = await makePokeImageGrab(pokeData);
    
    const attachmentHide = new AttachmentBuilder( await canvasList[0], { name: 'poke-image.png' });
    const attachmentRevel = new AttachmentBuilder( await canvasList[1], { name: 'poke-image.png' });

    await response.edit({ content: " ", embeds: [makeCardGrabShowEmbed(message, item, 'Click \`Reveal\` to revel the card.')], components: [makeSmallButton()], files: [attachmentHide] });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

    collector.on("collect", async i => {
        if (i.user != message.author) { return }

        i.deferUpdate();
        if (i.customId == "next") {
            await response.edit({ embeds: [makeCardGrabShowEmbed(message, item, " ")], components: [], files: [attachmentRevel] });

            setTimeout(async () => {
                cardCode = await createCardID(user);
                await user.addCard(cardCode, pokeItem);

                pokeItem.in_circulation++;
                pokeItem.save();

                userStat.card_grabbed++;
                userStat.save();

                checkSeriesCollect(await user.getCards(), pokeData["Series"], message);

                await response.edit({ embeds: [makeCardGrabShowEmbed(message, item, `**${formatName(pokeItem)}** \`${cardCode}\``)], components: [], files: [attachmentRevel] });

            }, 300)
        }
    });
    
}

// SPECIAL PULL

function makeSpecialPullEmbed(message, event) {

    const specialPull = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Use EVENT PULL [${event}]`)
        .setDescription(`${message.author}, do you want to use a EVENT PULL? \n\`\`\`Note: \n- Once used there is no way to cancel and the item will be used. \n- If you do not choose to a card, you will not get them and you will have wasted your event item.\n- Using this item does change or require your PULL COOLDOWN or GRAB COOLDOWN\n- Other players may and can grab the other card when you have picked yours.\`\`\``)

    return specialPull;
}

function makeSpecialPullCanceledEmbed(message, event) {

    const specialPull = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setTitle(`Use EVENT PULL [${event}]`)
        .setDescription(`${message.author}, canceled. \n\`\`\`Canceled use of EVENT PULL.\`\`\``)

    return specialPull;
}

async function useSpecialPull(message) {
    const response = await message.channel.send("Loading your pull...");

    const user = await Users.findOne({ where: { user_id: message.author.id } });
    if (!user) { await response.edit(`${message.author}, please register before tying to use an item. You can register using \`g!register\`.`); return; }

    const pullItem = await EventShop.findOne({ where: { name: "EVENT PULL" }});
    const hasItem = await UserEventItems.findOne({ where: { user_id: user.user_id, item_id: pullItem.id } });

    if (!hasItem) { await response.edit(`${message.author}, you do not own a EVENT PULL. Please use \`g!buy EVENT PULL\` to buy one.`); return; }

    await response.edit({ content: "", embeds: [makeSpecialPullEmbed(message, pullItem.event)], components: [makeButton()] });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

    collector.on("collect", async i => {
        if (i.user != message.author) { return; }

        i.deferUpdate();
        if (i.customId == "confirm") {
            hasItem.amount--;
            hasItem.save();
            
            response.delete();
            useSpecialPullAfter(message, user, pullItem);

        } else if (i.customId == "cancel") {
            await response.edit({ content: "", embeds: [makeSpecialPullCanceledEmbed(message, pullItem.event)], components: [] });
            
        }
    });
}

async function pullMechanics(message, response, pokemonData1, pokemonData2) {

    let card1Grabed = false;
    let userGrab1 = null;
    let card2Grabed = false;
    let userGrab2 = null;

    let otherUsers1 = [];
    let otherUsers2 = [];
    let userHasGrabed = false;

    async function checkGrabs(response, message) {
        if (card1Grabed == true && card2Grabed == true) {
            await response.edit({ components: [], content: `${message.author} pulled these cards.\nThese cards have expired` });
        }
    }
    
    let attachment = new AttachmentBuilder(await makePokeImagePull(pokemonData1, pokemonData2), { name: 'poke-images.png' });

    await response.edit({ content: `${message.author} pulled these cards.`, files: [attachment], components: [makeNumButton()] });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 40_000 });

    collector.on('collect', async i => {        

        i.deferUpdate();
        if (i.customId == 'card1' && card1Grabed == false) {
            if (userGrab2 && userGrab2.user == i.user) { return; }
            if (i.user != message.author && !userHasGrabed) { otherUsers1.push(i); return; }
            userGrab1 = i;

            card1Grabed = await checkGrabCard(message, pokemonData1, i);

            if (i.user == message.author) {
                userHasGrabed = true;
                if (otherUsers2.length > 0) {
                    const userI = Math.floor(Math.random() * otherUsers2.length);
                    card2Grabed = await checkGrabCard(message, pokemonData2, otherUsers2[userI]);
                }
            }
            await checkGrabs(response, message);
        }
        else if (i.customId == 'card2' && card2Grabed == false) {
            if (userGrab1 && userGrab1.user == i.user) { return; }
            if (i.user != message.author && !userHasGrabed) { otherUsers2.push(i); return; }
            userGrab2 = i;

            card2Grabed = await checkGrabCard(message, pokemonData2, i);

            if (i.user == message.author) {
                userHasGrabed = true;
                if (otherUsers1.length > 0) {
                    const userI = Math.floor(Math.random() * otherUsers1.length);
                    card1Grabed = await checkGrabCard(message, pokemonData1, otherUsers1[userI]);
                }
            }
            await checkGrabs(response, message);
        }
        else {
            await message.channel.send({ content: `${i.user} that card has already been taken.`})
        }
    });
    collector.on('end', async i => {
        await response.edit({ components: [], content: `${message.author} pulled these cards.\nThese cards have expired` });
    });
}

async function checkGrabCard(message, pokemonData, i) {

    const user = await Users.findOne({ where: { user_id: i.user.id } });
    if (!user) { return; }
    const userStat = await UserStats.findOne({ where: { user_id: user.user_id } });

    const pokeItem = await CardDatabase.findOne({ where: { card_id: pokemonData["CardID"] || "001", series: pokemonData["Series"], card_type: pokemonData["CardType"] } });
    pokeItem.in_circulation++;
    pokeItem.save();

    userStat.card_grabbed++;
    userStat.save();

    await checkGrabTitles(message, userStat);

    cardCode = await createCardID(user);
    await user.addCard(cardCode, pokeItem);

    checkSeriesCollect(await user.getCards(), pokemonData["Series"], message);

    await message.channel.send({ content: `${i.user} took the **${formatName(pokeItem)}** card \`${cardCode}\`.` });

    return true;
}

async function useSpecialPullAfter(message, user, pullItem) {
    let pokemonData1 = {};
    let pokemonData2 = {};

    const userStat = await UserStats.findOne({ where: { user_id: user.user_id } });

    pullChannel = await ServerInfo.findOne({ where: { server_id: message.guild.id, pull_channel: message.channel.id }});
    
    if (pullChannel) {

        userStat.card_drawn += 2;
        userStat.save();

        await checkPullTitles(message, userStat);

        pokemonData1 = getWhichStarEvent(pullItem.event);
        const pokeItem1 = await CardDatabase.findOne({ where: { card_id: pokemonData1["CardID"] || "001", series: pokemonData1["Series"], card_type: pokemonData1["CardType"] } });
        pokeItem1.times_pulled++;
        pokeItem1.save();

        pokemonData2 = getWhichStarEvent(pullItem.event);
        const pokeItem2 = await CardDatabase.findOne({ where: { card_id: pokemonData2["CardID"] || "001", series: pokemonData2["Series"], card_type: pokemonData2["CardType"] } });
        pokeItem2.times_pulled++;
        pokeItem2.save();

        usersWishArray = [];

        usersWishArray.push((await Wishlists.findAll({ where: { card_id: pokemonData1["CardID"], card_type : pokemonData1["CardType"] } })));
        usersWishArray.push((await Wishlists.findAll({ where: { card_id: pokemonData2["CardID"], card_type : pokemonData2["CardType"] } })));

        if (usersWishArray[0].length > 0 || usersWishArray[1].length > 0) {
            userAtArray = []

            for (const userCollection of usersWishArray) {
                for (const userData of userCollection) {
                    if(!userAtArray.find(prevUser => {return prevUser == message.client.users.cache.get((userData.user_id))})) {
                        userAtArray.push(message.client.users.cache.get((userData.user_id)));
                    }
                }
            }

            await message.channel.send(`${userAtArray.join(" ")} a card from your wishlist is dropping.`)
            const response = await message.channel.send("Loading your pull...");

            setTimeout(() => {
                pullMechanics(message, response, pokemonData1, pokemonData2);
            }, "1000");
        }
        else {
            const response = await message.channel.send("Loading your pull...");
            pullMechanics(message, response, pokemonData1, pokemonData2);
        }

    }
    else {
        await message.channel.send(`${message.author}, you can't pull in this channel.`);
        return;
    }
}

// GET ITEM USE

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