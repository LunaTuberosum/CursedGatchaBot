const { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { Users, UserCards, ItemShop, CardDatabase, UserStats, TitleDatabase, UserTitles, Tags } = require("../../dbObjects.js");
const allCards = require("../../packs/allCards.json");
const { makePokeImage, formatName } = require("../../pullingObjects.js");
const { getReleaseRange, getReleaseReward } = require("../../affectionObjects.js");
const { checkOwnTitle } = require("../../imageObjects.js");
const { splitContent } = require("../../commandObjects.js");

function makeReleaseEmbed(relaeseText, itemText, user, warningText) {
    const releaseEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle("Multi Release Cards")
        .setDescription(`${user}, say goodbye to:\n\`\`\`${relaeseText}\`\`\`\nThey will leave behind for you:\n${itemText}\n${warningText}`)

    return releaseEmbed;
}

function makeReleaseEmbedCancel(relaeseText, itemText, user) {
    const releaseEmbed = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setTitle("Multi Release Cards")
        .setDescription(`${user}, say goodbye to:\n\`\`\`${relaeseText}\`\`\`\nThey will leave behind for you:\n${itemText}\n**The release has been canceled.**`)

    return releaseEmbed;
}

function makeReleaseEmbedConfirm(relaeseText, itemText, user) {
    const releaseEmbed = new EmbedBuilder()
        .setColor("#26bd0f")
        .setTitle("Multi Release Cards")
        .setDescription(`${user}, say goodbye to:\n\`\`\`${relaeseText}\`\`\`\nThey will leave behind for you:\n${itemText}\n**The card has been released.**`)

    return releaseEmbed;
}

function makeButton() {

    const cancelButton = new ButtonBuilder()
        .setCustomId("cancel")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("❌");

    const releaseButton = new ButtonBuilder()
        .setCustomId("release")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("👋");

    const row = new ActionRowBuilder()
        .addComponents(cancelButton, releaseButton);

    return row;
}

function findCardInCollection(card) {
    
    for ( const series of Object.keys(allCards)) {
        for (const pName of Object.keys(allCards[series])) {
            if(pName == card) {
                return allCards[series][pName];
            }
        }
        
    }
}

module.exports = {
    cooldown: 5,
    name: 'multiRelease',
    shortName: ['mr'],
        
    async execute(message) {

        // Prepare Response
        const response = await message.channel.send("Preparing for release...");

        const splitMessage = splitContent(message);

        // Fetch User Data
        const user = await Users.findOne({ where: { user_id: message.author.id } });
        if (!user) { await response.edit(`${message.author}, you are not registered. Please register using \`g!register\`.`); return; }

        const userStat = await UserStats.findOne({ where: { user_id: user.user_id } });

        const userCards = await user.getCards();

        // Check if User Owns Cards
        if (userCards.length == 0) {
            response.edit(`${message.author} you have not cards to release.`);
            return;
        }

        // Prepare Cards Info
        let cardData = [];
        let releaseData = [];
        let previewData = [];
        let releaseEmbed;

        // Check Message Length
        if (splitMessage.length == 1) {
            await response.edit({ content: `${message.author}, you must specify the cards or tags you wish to release.` });
            return;
        }

        // Get All Card Codes
        const subSting = splitMessage.slice(1);

        // Iterate Through Codes
        for (const _sub of subSting) {
            // Check if Tag
            const tag = await Tags.findOne({ where: { user_id: user.user_id, name: _sub } });

            if(tag) {
                for (const _card of userCards) {
                    if (_card.tag == tag.name) { 
                        cardData.push(_card); 
                        releaseData.push(getReleaseReward(_card)); 
                        previewData.push(getReleaseRange(_card)); 
                    }
                }
                continue;
            }
            

            // Check For if Card
            for (const _card of userCards) {
                if (_card.item_id == _sub) { 
                    cardData.push(_card); 
                    releaseData.push(getReleaseReward(_card)); 
                    previewData.push(getReleaseRange(_card)); 
                    continue; 
                }
            }
            
        }

        // Card List and Warning if Leveled Cards
        let releaseText = "";
        let warningText = "";

        // Item Dict [Name: Amount]
        const itemDict = {
            "POKEDOLLAR": 0
        };

        // Iterate Through Cards
        let index = 0;
        for (const card of cardData) {
            // Fetch Release Data's Items
            for ([name, amount] of Object.entries(releaseData[index])) {
                
                if (name == "SHARD" || name == "GEM") {
                    // If it alrady exist Increment
                    if (itemDict[`${(card.item.type).toUpperCase()} ${name}`]) 
                        itemDict[`${(card.item.type).toUpperCase()} ${name}`] += amount;
                     
                    // Add New Entry if It Dosen't Exist
                    else itemDict[`${(card.item.type).toUpperCase()} ${name}`] = amount;
                }
            
                // Update Pokedollar Amount 
                else 
                    {
                        itemDict["POKEDOLLAR"] += amount;
                    }
            }

            // Add Warning if One Card is Leveled
            if (card.level > 0) warningText = "### One or more of cards are leveled. Are you sure you want to release these?";

            // Add Card Code to Release Text, If more than 6 add ...
            if (index == 6) releaseText += `... +${cardData.length - index} more cards`;
            else if (index > 6) {
                index++;
                continue;
            }
            else releaseText += `${card.item_id} - ${formatName(card.item)}\n`;

            index++;
        }

        // If Tag is Empty Throw Error
        if (cardData.length == 0) {
            await response.edit(`${message.author}, the tag you entered is empty, dosen't exist, or the card you entered isn't yours or dosen't exist.`);
            return;
        }

        // Preview Dict {Name: [Chance, Min, Max]}
        const previewDict = {};

        let preIndex = 0;
        for (const _preDict in previewData) {
            
            for ([name, amount] of Object.entries(previewData[_preDict])) { 
                if (name == "SHARD" || name == "GEM") {
                    if (previewDict[`${(cardData[preIndex].item.type).toUpperCase()} ${name}`]){
                        previewDict[`${(cardData[preIndex].item.type).toUpperCase()} ${name}`][0] = Math.min(previewDict[`${(cardData[preIndex].item.type).toUpperCase()} ${name}`][0] + amount[0], 100);
                        previewDict[`${(cardData[preIndex].item.type).toUpperCase()} ${name}`][1] += amount[1];
                        previewDict[`${(cardData[preIndex].item.type).toUpperCase()} ${name}`][2] += amount[2];
                    }
                    else
                        previewDict[`${(cardData[preIndex].item.type).toUpperCase()} ${name}`] = amount;
                }
                else {
                    if (previewDict[`${name}`]){
                        previewDict[`${name}`][0] = Math.min(previewDict[`${name}`][0] + amount[0], 100);
                        previewDict[`${name}`][1] += amount[1];
                        previewDict[`${name}`][2] += amount[2];
                    }
                    else
                        previewDict[`${name}`] = amount;
                }
                
            }

            // Check For Event Item
            let eventChance;
            if (cardData[preIndex].item.series == "CRAP") {
                // If a Crap Card 1 in 8
                eventChance = Math.max((Math.floor(Math.random() * (9 - 1) + 1)), 1); // The maximum is exclusive and the minimum is inclusive
                if (previewDict["BROKEN PAINTBRUSH"]) { 
                    previewDict["BROKEN PAINTBRUSH"][0] = Math.min(previewDict["BROKEN PAINTBRUSH"][0] + 12.5, 100);
                    previewDict["BROKEN PAINTBRUSH"][2] += 1
                }
                else
                    previewDict["BROKEN PAINTBRUSH"] = [12.5, 0, 1];
            }
            else {
                // If Any Card 1 in 10
                eventChance = Math.max((Math.floor(Math.random() * (11 - 1) + 1)), 1); // The maximum is exclusive and the minimum is inclusive
                if (previewDict["BROKEN PAINTBRUSH"]) { 
                    previewDict["BROKEN PAINTBRUSH"][0] = Math.min(previewDict["BROKEN PAINTBRUSH"][0] + 10, 100);
                    previewDict["BROKEN PAINTBRUSH"][2] += 1
                }
                else
                    previewDict["BROKEN PAINTBRUSH"] = [10, 0, 1];
            }
            // Add Event Item if eventChance = 1
            if (eventChance == 1) {
                if (itemDict["BROKEN PAINTBRUSH"]) itemDict["BROKEN PAINTBRUSH"] += 1;
                else itemDict["BROKEN PAINTBRUSH"] = 1;
            }

            preIndex++;
        }

        // Setup itemText
        let itemText = "";

        // Add to itemText Based on the Item
        for ([name, amount] of Object.entries(itemDict)) {
            if (name.includes("SHARD")) itemText += `🔸 ${amount} - ${name}\n`;
            else if (name.includes("GEM")) itemText += `🔶 ${amount} - ${name}\n`;
            else if (name.includes("POKEDOLLAR")) itemText += `💴 ${amount} - ${name}\n`;

            // Add Event Item to itemText
            else if (name.includes("BROKEN PAINTBRUSH")) itemText += `<:brokenBrush:1376696067982098544> ${amount} - \`BROKEN PAINTBRUSH\`\n`;
        }

        // Setup previewText
        let previewText = "";

        // Add to previewText Based on the Item
        for ([name, amount] of Object.entries(previewDict)) {
            if (name.includes("SHARD")) previewText += `\`${amount[0]}%\`: 🔸 ${amount[1]} - ${amount[2]} \`${name}\`\n`;
            else if (name.includes("GEM")) previewText += `\`${amount[0]}%\`: 🔶 ${amount[1]} - ${amount[2]} \`${name}\`\n`;
            else if (name.includes("POKEDOLLAR")) previewText += `\`${amount[0]}%\`: 💴 ${amount[1]} - ${amount[2]} \`${name}\`\n`;

            // Add Event Item to previewText
            else if (name.includes("BROKEN PAINTBRUSH")) previewText += `\`${amount[0]}%\`: <:brokenBrush:1376696067982098544> ${amount[1]} - ${amount[2]} \`BROKEN PAINTBRUSH\`\n`;
        }

        // Prepare Embed
        releaseEmbed = makeReleaseEmbed(releaseText, previewText, message.author, warningText);
        await response.edit({ content: "", embeds: [releaseEmbed], components: [makeButton()] });

        // Create Collector
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

        collector.on("collect", async i => {
            await i.deferUpdate();
            if (i.user != message.author) { return; }

            if (i.customId == "cancel") {
                // Create Cancel Embed
                releaseEmbed = makeReleaseEmbedCancel(releaseText, itemText, message.author)
                response.edit({ content: " ", embeds: [releaseEmbed], components: [] });
            }
            else if (i.customId == "release") {

                // Look Through itemDict and Add Items Within
                for ([name, amount] of Object.entries(itemDict)) {
                    if (name.includes("SHARD")) {
                        item = await ItemShop.findOne({ where: { name: name } });
                        user.addItem(item, amount);
                    }
                    else if (name.includes("GEM")) {
                        item = await ItemShop.findOne({ where: { name: name } });
                        user.addItem(item, amount);
                    }
                    else if (name.includes("POKEDOLLAR")) {
                        item = await ItemShop.findOne({ where: { name: name } });
                        user.addItem(item, amount);
                        userStat.money_own = userStat.money_own + amount;
                    }

                    // Event Item Add
                    else if (name.includes("BROKEN PAINTBRUSH")) {
                        item = await ItemShop.findOne({ where: { name: name } });
                        user.addItem(item, amount);
                    }
                }

                // Iterate Through Cards
                for (const card of cardData) {
                    // Remove Card Data
                    const _card = await CardDatabase.findOne({ where: { card_id: card.item.card_id } });
                    _card.in_circulation--;
                    _card.save();

                    // Destroy Card
                    UserCards.destroy({ where: { item_id: card.item_id } });
                    userStat.card_released++;
                }

                userStat.save()

                // Check Money Title
                checkOwnTitle(userStat, message);

                // Create and Send Comfirm Embed
                releaseEmbed = makeReleaseEmbedConfirm(releaseText, itemText, message.author)
                response.edit({ content: " ", embeds: [releaseEmbed], components: [] });

                // Check Release Title
                if (userStat.card_released == 100) {
                    const titleData = await TitleDatabase.findOne({ where: { name: "Catch and Release" } });

                    if (!titleData) { return; }

                    const userTitle = await UserTitles.findOne({ where: { user_id: message.author.id, title_id: titleData.id } });
                    
                    if (userTitle) { return; }

                    await UserTitles.create({ user_id: message.author.id, title_id: titleData.id });

                    await message.channel.send(`${message.author}, you have released 100 cards! You have gained the title: \`${titleData.name}\``)
                }
                
            }
            
        });

    },
};