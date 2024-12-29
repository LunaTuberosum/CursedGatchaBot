const { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { Users, ItemShop } = require('../../dbObjects.js');
const { formatName } = require("../../pullingObjects.js");
const { getLevelUpCost, getCurrentStats, getNewStats, getPassive, getSpecial } = require("../../affectionObjects.js")
const Canvas = require('@napi-rs/canvas');

function makeAffectionEmbed(cardCode, card, cardHP, costData, statChanges, levelUnlocks) {

    const affectionEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Affection - ${cardCode}`)
        .setThumbnail(`attachment://poke-image.png`)
        .setDescription(`**Name:** ${formatName(card.item)} \n**Type:** ${card.item.type} \n\n**Level:**\`${card.level}\` \n**HP:**\`${makeHealthBar(cardHP, cardHP)} ${cardHP} / ${cardHP}\` \n**Attack:**\`${card.attack}\` \n**Defence:**\`${card.defence}\` \n**Speed:**\`${card.speed}\` \n\n\`LV. ${ card.level == 10 ? 'MAX' : `${card.level} -> LV. ${card.level + 1}`}\` \n\`\`\`diff\nMaterials: \n${costData} \n\nStats: \n${statChanges}\`\`\` \n\n\`Level Unlocks:\` \n\`\`\`ansi\n${levelUnlocks["1"]} \n\n${levelUnlocks["5"]} \n\n${levelUnlocks["10"]}\`\`\``)
        .setFooter({ text: `Learn info about specials and passives with info button below`})

    return affectionEmbed;
}

function makeButtonAffection() {

    const levelButton = new ButtonBuilder()
        .setCustomId("level")
        .setStyle(ButtonStyle.Success)
        .setLabel("Level Up")
    const infoButton = new ButtonBuilder()
        .setCustomId("info")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("📄");

    const row = new ActionRowBuilder()
        .addComponents(levelButton, infoButton)

    return row;
}

function affectionEmbedBuilder(splitMessage, card) {
    const levelCost = getLevelUpCost(card);
    let costData

    const newStats = getNewStats(card);
    const currStats = getCurrentStats(card);
    let statChanges;

    if (card.level == 10) {
        statChanges = `- NONE`;
        costData = `- NONE`;
    }
    else {
        statChanges = `+ ${newStats["HP"] - currStats["HP"]} HP \n+ ${newStats["Attack"] - card.attack} Attack \n+ ${newStats["Defence"] - card.defence} Defence \n+ ${newStats["Speed"] - card.speed} Speed`;
        costData = `- ${levelCost["Resource"]["Amount"]} ${(card.item.type).toUpperCase()} ${levelCost["Resource"]["Type"]} ${card.item.card_type == "HOLOFRAME" ? `\n- ${levelCost["HoloResource"]} SPECIAL ITEM` : ""} \n- ${levelCost["Money"]} POKEDOLLARS`
    };

    const passiveData = getPassive(card);
    const specialData = getSpecial(card);
    const levelUnlocks = {
        "1": `[0;${card.level >= 1 ? 37 : 30}m${card.level >= 1 ? " " : "🔒"} Lv. 1: ${passiveData["Name"]} `,
        "5": `[0;${card.level >= 5 ? 37 : 30}m${card.level >= 5 ? " " : "🔒"} Lv. 5: ${specialData["Name"]} \n${card.level >= 5 ? " " : "🔒"} Lv. 5: ${passiveData["Name"]} ★ `,
        "10": `[0;${card.level == 10 ? 37 : 30}m${card.level >= 10 ? " " : "🔒"} Lv. 10: ${specialData["Name"]} ★ \n${card.level >= 10 ? " " : "🔒"} Lv. 10: ${passiveData["Name"]} ★★ `
    };

    return new makeAffectionEmbed(splitMessage[1], card, currStats["HP"], costData, statChanges, levelUnlocks);

}

function makeInfoEmbed(cardCode, card, passiveInfo, specialInfo) {

    const infoEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Affection - ${cardCode}`)
        .setThumbnail(`attachment://poke-image.png`)
        .setDescription(`**Name:** ${formatName(card.item)} \n**Type:** ${card.item.type} \n\n\`Passive:\` \n\`\`\`ansi\n${passiveInfo["1"]} \n\n${passiveInfo["5"]} \n\n${passiveInfo["10"]}\`\`\` \n\`Special:\` \n\`\`\`ansi\n${specialInfo["5"]} \n\n${specialInfo["10"]}\`\`\``)
        .setFooter({ text: `Return to level up page with button below`})

    return infoEmbed;
}

function makeButtonInfo() {

    const backButton = new ButtonBuilder()
        .setCustomId("back")
        .setStyle(ButtonStyle.Success)
        .setEmoji("📊");

    const row = new ActionRowBuilder()
        .addComponents(backButton);

    return row;
}

function infoEmbedMaker(splitMessage, card) {
    const passiveData = getPassive(card)
    const passiveInfo = {
        "1": `[0;${card.level >= 1 ? 37 : 30}m${passiveData["Name"]} (Lv. 1): ${card.level >= 1 ? " " : "🔒"} \n${passiveData["Levels"]["1"]}`,
        "5": `[0;${card.level >= 5 ? 37 : 30}m${passiveData["Name"]} ★ (Lv. 5): ${card.level >= 5 ? " " : "🔒"} \n${passiveData["Levels"]["5"]}`,
        "10": `[0;${card.level == 10 ? 37 : 30}m${passiveData["Name"]} ★★ (Lv. 10): ${card.level >= 10 ? " " : "🔒"} \n${passiveData["Levels"]["10"]}`
    }

    const specialData = getSpecial(card)
    const specialInfo = {
        "5": `[0;${card.level >= 5 ? 37 : 30}m${specialData["Name"]} (Lv. 5): ${card.level >= 5 ? " " : "🔒"} \n${specialData["Levels"]["5"]}`,
        "10": `[0;${card.level == 10 ? 37 : 30}m${specialData["Name"]} ★ (Lv. 10): ${card.level >= 10 ? " " : "🔒"} \n${specialData["Levels"]["10"]}`
    }

    return new makeInfoEmbed(splitMessage[1], card, passiveInfo, specialInfo);
}

function makeLevelEmbed(cardCode, card, costData, statChanges, newAbilities) {

    const levelEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Affection - ${cardCode} [Level ${card.level} -> ${card.level + 1}]`)
        .setThumbnail(`attachment://poke-image.png`)
        .setDescription(`**Name:** ${formatName(card.item)} \n**Type:** ${card.item.type} \n\n\`Lv. ${card.level} -> ${card.level + 1}\` \n\`\`\`diff\nYou will lose: \n${costData} \n\nYou will gain: \n${statChanges} ${newAbilities}\`\`\``)

    return levelEmbed;
}

function makeLevelConfirmEmbed(cardCode, card, statChanges, newAbilities) {

    const levelEmbed = new EmbedBuilder()
        .setColor("#26bd0f")
        .setTitle(`Affection - ${cardCode} [Confirm]`)
        .setThumbnail(`attachment://poke-image.png`)
        .setDescription(`**Name:** ${formatName(card.item)} \n**Type:** ${card.item.type} \n\n\`Lv. ${card.level + 1}\` \n\`\`\`diff\nYou leveled up: \n${statChanges} ${newAbilities}\`\`\``)

    return levelEmbed;
}

function makeLevelCancelEmbed(cardCode, card) {

    const levelEmbed = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setTitle(`Affection - ${cardCode} [Cancel]`)
        .setThumbnail(`attachment://poke-image.png`)
        .setDescription(`**Name:** ${formatName(card.item)} \n**Type:** ${card.item.type} \n\n**Level:** \`${card.level}\` \n\`\`\`diff\nLevel up has been canceled.\`\`\``)

    return levelEmbed;
}

function makeLevelFailEmbed(cardCode, card) {

    const levelEmbed = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setTitle(`Affection - ${cardCode} [Cancel]`)
        .setThumbnail(`attachment://poke-image.png`)
        .setDescription(`**Name:** ${formatName(card.item)} \n**Type:** ${card.item.type} \n\n**Level:** \`${card.level}\` \n\`\`\`diff\nYou can not afford to level up.\`\`\``)

    return levelEmbed;
}

function makeButtonLevel() {

    const confirmButton = new ButtonBuilder()
        .setCustomId("confirm")
        .setStyle(ButtonStyle.Success)
        .setEmoji("✔");

    const cancelButton = new ButtonBuilder()
        .setCustomId("cancel")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("✖");

    const row = new ActionRowBuilder()
        .addComponents(confirmButton, cancelButton);

    return row
}

function levelEmbedBuilder(splitMessage, card) {
    const levelCost = getLevelUpCost(card);
    let costData;

    const newStats = getNewStats(card);
    const currStats = getCurrentStats(card);
    
    let statChanges;

    if (card.level < 10) {
        costData = `- ${levelCost["Resource"]["Amount"]} ${(card.item.type).toUpperCase()} ${levelCost["Resource"]["Type"]} ${card.item.card_type == "HOLOFRAME" ? `\n- ${levelCost["HoloResource"]} SPECIAL ITEM` : ""} \n- ${levelCost["Money"]} POKEDOLLARS`
        statChanges = `+ ${newStats["HP"] - currStats["HP"]} HP \n+ ${newStats["Attack"] - card.attack} Attack \n+ ${newStats["Defence"] - card.defence} Defence \n+ ${newStats["Speed"] - card.speed} Speed`;
    };

    const passiveData = getPassive(card);
    const specialData = getSpecial(card);
    const newAbilities = `${card.level == 4 || card.level == 9 ? `\n\n${card.level == 4 ? `+ ${specialData["Name"]} \n+ ${passiveData["Name"]} ★` : card.level == 9 ? `+ ${specialData["Name"]} ★ \n+ ${passiveData["Name"]} ★★` : ``}` : ``}`;

    return new makeLevelEmbed(splitMessage[1], card, costData, statChanges, newAbilities);
}

function levelConfirmEmbedBuilder(splitMessage, card) {
    const newStats = getNewStats(card);
    const currStats = getCurrentStats(card);
    let statChanges;

    if (card.level < 10) statChanges = `+ ${currStats["HP"]} -> ${newStats["HP"]} HP \n+ ${card.attack} -> ${newStats["Attack"]} Attack \n+ ${card.defence} -> ${newStats["Defence"]} Defence \n+ ${card.speed} -> ${newStats["Speed"]} Speed`

    const passiveData = getPassive(card);
    const specialData = getSpecial(card);
    const newAbilities = `${card.level == 5 || card.level == 10 ? `\n\n${card.level == 5 ? `+ ${specialData["Name"]} \n+ ${passiveData["Name"]} ★` : card.level == 10 ? `+ ${specialData["Name"]} ★ \n+ ${passiveData["Name"]} ★★` : ``}` : ``}`;

    return new makeLevelConfirmEmbed(splitMessage[1], card, statChanges, newAbilities);
}

function findItem(collection, itemName) {
    for (const item of collection) {
        if (item.item.name == itemName) {
            return item;
        }
    }
    return null;
}

function makeHealthBar(maxHealth, curHealth) {
    const green = "🟩";
    const red = "🟥";
    let curHealthSquares = Math.ceil(curHealth / 20); 
    
    let healthBar = "";

    for (let health = 1; health <= (maxHealth / 20); health++) {
        if (health <= curHealthSquares) {
            healthBar += green;
        }
        else {
            healthBar += red;
        }
    }

    return healthBar;
}

module.exports = {
    name: "affection",
    shortName: ["a"],
        
    async execute(message) {
        const splitMessage = message.content.split(" ");
        const user = await Users.findOne({ where: { user_id: message.author.id } });

        let affectionEmbed;
        let infoEmbed;
        let levelEmbed;
        let levelConfirmEmbed;
        let levelFailEmbed;
        let levelCancelEmbed;

        let affectionButton;
        let infoButton;
        let levelButton;
        let levelCost;
        let newStats
        let aCard;

        let attachment;
        let response = await message.channel.send("...");

        if (splitMessage.length <= 1) {
            message.channel.send({ content: `${message.author} please enter a valid card code.` });
            return;
        }
        if (splitMessage[1].length != 6) {
            message.channel.send({ content: `${message.author} please enter a valid card code.` });
            return;
        }
            
        try {
            const user = await Users.findOne({ where: { user_id: message.author.id } });
            if (!user) { 
                await message.channel.send(`${message.author}, you are not registered. Please register using \`c!register\`.`); 
                return; 
            }
            const userCards = await user.getCards();

            
            for (const card of userCards) {
                if (card.item_id == splitMessage[1]) {
                    aCard = card
                    
                    const canvas = Canvas.createCanvas(720, 1290);
                    const context = canvas.getContext('2d');

                    const img1 = await Canvas.loadImage(`./pokeImages/${card.item.card_id}-${card.item.name}.png`);
                    const img2 = await Canvas.loadImage(`./pokeImages/frames/Normal-Frame.png`);

                    context.drawImage(img1, 0, 0, img1.width, img1.height);
                    context.drawImage(img2, 0, 0, img1.width, img1.height);

                    attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'poke-image.png' });

                    newStats = getNewStats(card);
                    affectionEmbed = affectionEmbedBuilder(splitMessage, card);
                    affectionButton = makeButtonAffection();
                    if (card.level == 10) affectionButton.components[0].setDisabled(true);

                    infoEmbed = infoEmbedMaker(splitMessage, card);
                    infoButton = makeButtonInfo();

                    levelCost = getLevelUpCost(card);
                    levelEmbed = new levelEmbedBuilder(splitMessage, card);
                    levelConfirmEmbed = new levelConfirmEmbedBuilder(splitMessage, card);
                    levelCancelEmbed = new makeLevelCancelEmbed(splitMessage[1], card);
                    levelFailEmbed = new makeLevelFailEmbed(splitMessage[1], card);
                    levelButton = makeButtonLevel();

                    await response.edit({ content: "", embeds: [affectionEmbed], components: [affectionButton], files: [attachment] });
                    break;
                }
            }
        }
        catch (e) {
            console.error(e);
            message.channel.send({ content: `${message.author} you do not own that card.` });
            return;
        }

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

        collector.on("collect", async i => {
            if (i.user == message.author) {
                if (i.customId == "level") {
                    response.edit({ content: "", embeds: [levelEmbed], components: [levelButton], files: [attachment] });
                    i.deferUpdate();
                }
                else if (i.customId == "info") {
                    await response.edit({ content: "", embeds: [infoEmbed], components: [infoButton], files: [attachment] });
                    i.deferUpdate();
                }

                else if (i.customId == "back") {
                    await response.edit({ content: "", embeds: [affectionEmbed], components: [affectionButton], files: [attachment] });
                    i.deferUpdate();
                }

                else if (i.customId == "confirm") {
                    const userItems = await user.getItems();
                    const costItemData = await ItemShop.findOne({ where: { name: `${(aCard.item.type).toUpperCase()} ${levelCost["Resource"]["Type"]}` } });
                    const userItemData = findItem(userItems, costItemData.name);
                    
                    if (!userItemData) {
                        await response.edit({ embeds: [levelFailEmbed], components: [] });
                        return;
                    }

                    if (userItemData.amount < levelCost["Resource"]["Amount"]) {
                        await response.edit({ embeds: [levelFailEmbed], components: [] });
                        return;
                    }

                    userItemData.amount -= (levelCost["Resource"]["Amount"]);
                    userItemData.save();

                    if (aCard.item.card_type == "HOLOFRAME") {
                        const specialCostData = await ItemShop.findOne({ where: { name: `SPECIAL ITEM` } });
                        const specialItemData = findItem(userItems, specialCostData.name);
                        
                        if (!specialItemData) {
                            await response.edit({ embeds: [levelFailEmbed], components: [] });
                            return;
                        }

                        if (specialItemData.amount < levelCost["HoloResource"]) {
                            await response.edit({ embeds: [levelFailEmbed], components: [] });
                            return;
                        }

                        specialItemData.amount -= (levelCost["HoloResource"]);
                        specialItemData.save();
                    }

                    const costMoneyData = await ItemShop.findOne({ where: { name: `POKEDOLLAR` } });
                    const moneyItemData = findItem(userItems, costMoneyData.name);
                    
                    if (!moneyItemData) {
                        await response.edit({ embeds: [levelFailEmbed], components: [] });
                        return;
                    }

                    if (moneyItemData.amount < levelCost["Money"]) {
                        await response.edit({ embeds: [levelFailEmbed], components: [] });
                        return;
                    }

                    moneyItemData.amount -= (levelCost["Money"]);
                    moneyItemData.save();

                    aCard.level += 1;
                    aCard.attack = newStats["Attack"]
                    aCard.defence = newStats["Defence"]
                    aCard.speed = newStats["Speed"]
                    aCard.save()

                    await response.edit({ content: "", embeds: [levelConfirmEmbed], components: [infoButton], files: [attachment] });

                    newStats = getNewStats(aCard);
                    affectionEmbed = affectionEmbedBuilder(splitMessage, aCard);
                    affectionButton = makeButtonAffection();
                    if (aCard.level == 10) affectionButton.components[0].setDisabled(true);

                    infoEmbed = infoEmbedMaker(splitMessage, aCard);
                    infoButton = makeButtonInfo();

                    levelCost = getLevelUpCost(aCard);
                    levelEmbed = new levelEmbedBuilder(splitMessage, aCard);
                    levelConfirmEmbed = new levelConfirmEmbedBuilder(splitMessage, aCard);
                    levelCancelEmbed = new makeLevelCancelEmbed(splitMessage[1], aCard);
                    levelButton = makeButtonLevel();

                    i.deferUpdate();
                    return;
                }

                else if (i.customId == "cancel") {
                    await response.edit({ content: "", embeds: [levelCancelEmbed], components: [], files: [attachment] });
                    i.deferUpdate();
                }
            }
        });
    }
}