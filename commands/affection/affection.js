const { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const { Users, ItemShop, CharmShop, UserCharms } = require('../../dbObjects.js');
const { formatName, makePokeImage } = require("../../pullingObjects.js");
const { getLevelUpCost, getCurrentStats, getNewStats, getPassive, getSpecial } = require("../../affectionObjects.js")
const Canvas = require('@napi-rs/canvas');

function makeAffectionEmbed(cardCode, card, cardHP, costData, statChanges, levelUnlocks) {

    const affectionEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Affection - ${cardCode}`)
        .setThumbnail(`attachment://poke-image.png`)
        .setDescription(`**Name:** ${formatName(card.item)} \n**Type:** ${card.item.type} \n\n**Level:**\`${card.level}\` \n**HP:**\`${makeHealthBar(cardHP, cardHP)} ${cardHP} / ${cardHP}\` \n**Attack:**\`${card.attack}\` \n**Defense:**\`${card.defence}\` \n**Speed:**\`${card.speed}\` \n\n\`LV. ${ card.level == 10 ? 'MAX' : `${card.level} -> LV. ${card.level + 1}`}\` \n\`\`\`diff\nMaterials: \n${costData} \n\nStats: \n${statChanges}\`\`\` \n\n\`Level Unlocks:\` \n\`\`\`ansi\n${levelUnlocks["1"]} \n\n${levelUnlocks["5"]} \n\n${levelUnlocks["10"]}\`\`\``)
        .setFooter({ text: `Learn info about specials and passives with info button below`})

    return affectionEmbed;
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
        statChanges = `+ ${newStats["HP"] - currStats["HP"]} HP \n+ ${newStats["Attack"] - card.attack} Attack \n+ ${newStats["Defense"] - card.defence} Defense \n+ ${newStats["Speed"] - card.speed} Speed`;
        costData = `- ${levelCost["Resource"]["Amount"]} ${(card.item.type).toUpperCase()} ${levelCost["Resource"]["Type"]} \n- ${levelCost["Money"]} POKEDOLLARS`
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

function makeButtonAffection() {

    const levelButton = new ButtonBuilder()
        .setCustomId("level")
        .setStyle(ButtonStyle.Success)
        .setLabel("Level Up")
    const infoButton = new ButtonBuilder()
        .setCustomId("info")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("📄");
    const charmButton = new ButtonBuilder()
        .setCustomId("charm")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🏵️");

    const row = new ActionRowBuilder()
        .addComponents(levelButton, infoButton, charmButton)

    return row;
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
        .setStyle(ButtonStyle.Secondary)
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

function makeCharmEmbed(cardCode, aCard, errorText) {

    const charmEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Affection - ${cardCode}`)
        .setImage(`attachment://poke-image.png`)
        .setDescription(`Please select your charms below. To confirm you selection press the \`✔\` button.\n\n**Current Charms:**\n\`Charm 1:\` ${aCard.charm_1}\n\`Charm 2:\` ${aCard.charm_2}\n\`Charm 3:\` ${aCard.charm_3}\n\n${errorText}`)
        .setFooter({ text: `Return to level up page with button below`})

    return charmEmbed;
}

function charmEmbedMaker(splitMessage, aCard, errorCode=[]) {
    errorText = '';
    for (error of errorCode) {
        if (errorText == '') errorText += '```diff';

        errorText += `\n- Failed to set Charm ${error}.`;
    }
    if (errorText != '') errorText += '```'

    return new makeCharmEmbed(splitMessage[1], aCard, errorText);

}

function makeCharmSelection(aCard, userCharms) {
    const row1 = createCharmRow(aCard.charm_1, userCharms, "charm1", "first");
    const row2 = createCharmRow(aCard.charm_2, userCharms, "charm2", "second");
    const row3 = createCharmRow(aCard.charm_3, userCharms, "charm3", "third");

    return [row1, row2, row3]
}

function createCharmRow(charmInfo, userCharms, charmName, place) {

    let charmMap = [];
    
    if (charmInfo != "None") {
        charmMap = [{
            label: "Deselect Charm",
            description: "Remove charm from slot.",
            emoji: "🚫",

            value: "None"
        }];
    }


    for (charm of userCharms) {
        charmMap.push({
            label: charm.item.name,
            description: `(x${charm.amount}) ${charm.item.description}`,
            emoji: charm.item.emoji,

            value: charm.item.name
        })
    }

    if (charmMap.length == 0) {
        charmMap = [{
            label: "You have no Charms",
            description: "To buy a charm check out the `g!charmShop`",
            emoji: "❌",

            value: "None"
        }]
    }

    const select = new StringSelectMenuBuilder()
        .setCustomId(charmName)
        .setPlaceholder(`Select your ${place} Charm.`)
        .addOptions(
            charmMap.map((charm) =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(charm.label)
                    .setDescription(charm.description)
                    .setEmoji(charm.emoji)

                    .setValue(charm.value)
            )
        );

    const row = new ActionRowBuilder()
        .addComponents(select);

    return row
}

function makeCharmButtons() {
    const confirmButton = new ButtonBuilder()
        .setCustomId("confirmCharm")
        .setStyle(ButtonStyle.Success)
        .setEmoji("✔");

    const backButton = new ButtonBuilder()
        .setCustomId("back")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("📊");

    const row = new ActionRowBuilder()
        .addComponents(confirmButton, backButton);

    return row

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

    const backButton = new ButtonBuilder()
        .setCustomId("back")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("📊");

    const row = new ActionRowBuilder()
        .addComponents(confirmButton, cancelButton, backButton);

    return row
}

function levelEmbedBuilder(splitMessage, card) {
    const levelCost = getLevelUpCost(card);
    let costData;

    const newStats = getNewStats(card);
    const currStats = getCurrentStats(card);
    
    let statChanges;

    if (card.level < 10) {
        costData = `- ${levelCost["Resource"]["Amount"]} ${(card.item.type).toUpperCase()} ${levelCost["Resource"]["Type"]} \n- ${levelCost["Money"]} POKEDOLLARS`
        statChanges = `+ ${newStats["HP"] - currStats["HP"]} HP \n+ ${newStats["Attack"] - card.attack} Attack \n+ ${newStats["Defense"] - card.defence} Defense \n+ ${newStats["Speed"] - card.speed} Speed`;
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

    if (card.level < 10) statChanges = `+ ${currStats["HP"]} -> ${newStats["HP"]} HP \n+ ${card.attack} -> ${newStats["Attack"]} Attack \n+ ${card.defence} -> ${newStats["Defense"]} Defense \n+ ${card.speed} -> ${newStats["Speed"]} Speed`

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

async function checkCharm(charmName, charmData, charmCard, user, userCharms) {
    if (charmCard != "None") {
        let charm = await CharmShop.findOne({ where: { name: charmCard } });
        await user.addItem(charm, 1, 2);
    }
    
    if (charmData[charmName] != "None") {
        let did = false
        for (c of userCharms) {
            if (c.item.name == charmData[charmName]) {
                did = true
                if (c.amount == 1) {
                    await UserCharms.destroy({ where: { user_id: user.user_id, item_id: c.item.id }});
                    break;
                }
                
                c.amount -= 1;
                c.save();
                break;
            }
        }

        if (!did) {
            return charmCard
        }
    }

    return charmData[charmName];
}

module.exports = {
    name: "affection",
    shortName: ["a"],
        
    async execute(message) {
        const response = await message.channel.send("Loading your pokemon...");

        const splitMessage = message.content.split(" ");
        const user = await Users.findOne({ where: { user_id: message.author.id } });
        let userCharms = await user.getCharms();

        let affectionEmbed;
        let infoEmbed;
        let charmEmbed;
        let levelEmbed;
        let levelConfirmEmbed;
        let levelFailEmbed;
        let levelCancelEmbed;

        let affectionButton;
        let infoButton;
        let charmSelections;
        let levelButton;
        let levelCost;
        let newStats
        let aCard;

        let attachment;

        if (splitMessage.length <= 1) {
            response.edit({ content: `${message.author} please enter a valid card code.` });
            return;
        }
        if (splitMessage[1].length != 6) {
            response.edit({ content: `${message.author} please enter a valid card code.` });
            return;
        }
            
        try {
            const user = await Users.findOne({ where: { user_id: message.author.id } });
            if (!user) { 
                await response.edit(`${message.author}, you are not registered. Please register using \`g!register\`.`); 
                return; 
            }
            const userCards = await user.getCards();

            
            for (const card of userCards) {
                if (card.item_id == splitMessage[1]) {
                    aCard = card

                    attachment = new AttachmentBuilder(await makePokeImage(card.item, card), { name: 'poke-image.png' });

                    newStats = getNewStats(card);
                    affectionEmbed = affectionEmbedBuilder(splitMessage, card);
                    affectionButton = makeButtonAffection();
                    if (card.level == 10) affectionButton.components[0].setDisabled(true);

                    infoEmbed = infoEmbedMaker(splitMessage, card);
                    infoButton = makeButtonInfo();

                    charmEmbed = charmEmbedMaker(splitMessage, aCard);

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
            response.edit({ content: `${message.author} you do not own that card.` });
            return;
        }

        if (!aCard) {
            await response.edit(`${message.author} you do not own that card.`);
            return;
        }

        let charmData = {
            "Charm1": aCard.charm_1,
            "Charm2": aCard.charm_2,
            "Charm3": aCard.charm_3
        }

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

        collector.on("collect", async i => {
            i.deferUpdate();
            if (i.user == message.author) {
                collector.resetTimer();
                
                if (i.customId == "level") {
                    response.edit({ content: "", embeds: [levelEmbed], components: [levelButton], files: [attachment] });
                }
                else if (i.customId == "info") {
                    await response.edit({ content: "", embeds: [infoEmbed], components: [infoButton], files: [attachment] });
                }
                else if (i.customId == "charm") {
                    charmSelections = makeCharmSelection(aCard, await user.getCharms());
                    await response.edit({ content: "", embeds: [charmEmbed], components: [charmSelections[0], charmSelections[1], charmSelections[2], makeCharmButtons()], files: [attachment] });
                }
                else if (i.customId == "confirmCharm") {
                    let errorCode = [];

                    if (aCard.charm_1 != charmData["Charm1"]) {
                        aCard.charm_1 = await checkCharm("Charm1", charmData, aCard.charm_1, user, userCharms);
                        if (aCard.charm_1 != charmData["Charm1"]) {
                            errorCode.push(1);
                        }
                        
                        userCharms =  await user.getCharms();
                    }

                    if (aCard.charm_2 != charmData["Charm2"]) {
                        aCard.charm_2 = await checkCharm("Charm2", charmData, aCard.charm_2, user, userCharms);
                        if (aCard.charm_2 != charmData["Charm2"]) {
                            errorCode.push(2);
                        }
                        
                        userCharms =  await user.getCharms();
                    }

                    if (aCard.charm_3 != charmData["Charm3"]) {
                        aCard.charm_3 = await checkCharm("Charm3", charmData, aCard.charm_3, user, userCharms);
                        if (aCard.charm_3 != charmData["Charm3"]) {
                            errorCode.push(3);
                        }
                        
                        userCharms =  await user.getCharms();
                    }

                    aCard.save();

                    attachment = new AttachmentBuilder(await makePokeImage(aCard.item, aCard), { name: 'poke-image.png' });
                    charmEmbed = charmEmbedMaker(splitMessage, aCard, errorCode);
                    charmSelections = makeCharmSelection(aCard, await user.getCharms());

                    await response.edit({ content: "", embeds: [charmEmbed], components: [charmSelections[0], charmSelections[1], charmSelections[2], makeCharmButtons()], files: [attachment] });
                }

                else if (i.customId == "back") {
                    await response.edit({ content: "", embeds: [affectionEmbed], components: [affectionButton], files: [attachment] });
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
                    aCard.defence = newStats["Defense"]
                    aCard.speed = newStats["Speed"]
                    aCard.save()

                    if (aCard.level == 5 || aCard.level == 10) {
                        attachment = new AttachmentBuilder(await makePokeImage(aCard.item, aCard), { name: 'poke-image.png' });
                    }
                    
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

                    return;
                }

                else if (i.customId == "cancel") {
                    await response.edit({ content: "", embeds: [levelCancelEmbed], components: [], files: [attachment] });
                }
            }
        });

        const collectorSelect = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 150_000 });

        collectorSelect.on("collect", async i => {
            i.deferUpdate();
            if (i.user == message.author) {
                collectorSelect.resetTimer();
                
                if (i.customId == "charm1") charmData["Charm1"] =  i.values[0];
                if (i.customId == "charm2") charmData["Charm2"] =  i.values[0];
                if (i.customId == "charm3") charmData["Charm3"] =  i.values[0];
            }
        });
    }


}