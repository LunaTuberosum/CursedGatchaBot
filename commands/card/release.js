const { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { Users, UserCards, ItemShop, CardDatabase, UserStats, TitleDatabase, UserTitles } = require("../../dbObjects.js");
const allCards = require("../../packs/allCards.json");
const { makePokeImage } = require("../../pullingObjects.js");
const { getReleaseRange, getReleaseReward } = require("../../affectionObjects.js");
const { checkOwnTitle } = require("../../imageObjects.js");
const { splitContent } = require("../../commandObjects.js");

function makeReleaseEmbed(cardInfo, itemText, user, leveled) {
    
    const releaseEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setThumbnail(`attachment://poke-image.png`)
        .setTitle("Release Card")
        .setDescription(`${user}, **${cardInfo["Name"]}** will leave behind for you:\n\n${itemText}\n${leveled ? "### This card has been level. Are you sure you want to release it?": ""}`)

    return releaseEmbed;
}

function makeReleaseEmbedCancel(cardInfo, itemText, user) {
    const releaseEmbed = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setThumbnail(`attachment://poke-image.png`)
        .setTitle("Release Card")
        .setDescription(`${user}, **${cardInfo["Name"]}** will leave behind for you:\n\n${itemText}\n\n**Card Release has been canceled.**`)

    return releaseEmbed;
}

function makeReleaseEmbedConfirm(cardInfo, itemText, user) {
    const releaseEmbed = new EmbedBuilder()
        .setColor("#26bd0f")
        .setThumbnail(`attachment://poke-image.png`)
        .setTitle("Release Card")
        .setDescription(`${user}, **${cardInfo["Name"]}** will leave behind for you:\n\n${itemText}\n\n**The card has been released.**`)

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
        if (series != card.series) continue;
        for (const pName of Object.keys(allCards[series])) {
            if(allCards[series][pName]["Name"] == card.name) {
                return allCards[series][pName];
            }
        }
        
    }
}

module.exports = {
    cooldown: 5,
    name: 'release',
    shortName: ['r'],
        
    async execute(message) {

        // Prepare Resopnse
        const response = await message.channel.send("Preparing for release...");

        const splitMessage = splitContent(message);

        // Fetch User Data
        const user = await Users.findOne({ where: { user_id: message.author.id } });
        if (!user) { await response.edit(`${message.author}, you are not registered. Please register using \`g!register\`.`); return; }

        const userStat = await UserStats.findOne({ where: { user_id: user.user_id } });

        const userCards = await user.getCards();

        // Check if User Owns Cards
        if (userCards.length == 0) {
            response.edit(`${message.author} you have no cards to release.`);
            return;
        }

        // Prepare Card Info
        let pokemonData;
        let cardData;
        let releaseEmbed;
        let attachment;

        // Check meesage length
        if (splitMessage.length > 1) {

            // Check Given Code
            if (splitMessage[1].length < 6) {
                await response.edit({ content: `${message.author} please enter a valid card code.` });
                return;
            }

            for (_card of userCards) {
                if (_card.item_id == splitMessage[1]) {
                    cardData = _card;
                }
            }

            if (!cardData) {
                await response.edit({ content: `${message.author}, you do not own that card.` });
                return;
            }

        }
        else {

            // Use Most Recent Card
            cardData = userCards[userCards.length - 1];
        }

        // Get Pokemon Data and Release Data
        pokemonData = findCardInCollection(cardData.item);            
        releaseData = getReleaseReward(cardData);

        // Item Dict [Name: Amount]
        const itemDict = {
            "POKEDOLLAR": 0
        };
            
        // Fetch Release Data's Items
        for ([name, amount] of Object.entries(releaseData)) {

            // Check if Shard or Gem
            if (name == "SHARD" || name == "GEM") {
                // If it alrady exist Increment
                if (itemDict[`${(cardData.item.type).toUpperCase()} ${name}`]) 
                    itemDict[`${(cardData.item.type).toUpperCase()} ${name}`] += amount;

                // Add New Entry if It Dosen't Exist
                else itemDict[`${(cardData.item.type).toUpperCase()} ${name}`] = amount;
            }

            // Update Pokedollar Amount 
            else itemDict["POKEDOLLAR"] += amount;
        }

        // Preview Dict [Name: [Chance, Min, Max]]
        const previewDict = getReleaseRange(cardData)

        // Check For Event Item
        let eventChance;
        
        if (pokemonData["Series"] == "CRAP") {
            // If a Crap Card 1 in 8
            eventChance = Math.max((Math.floor(Math.random() * (9 - 1) + 1)), 1); // The maximum is exclusive and the minimum is inclusive
            previewDict["BROKEN PAINTBRUSH"] = [12.5, 0, 1];
        }
        else {
            // If Any Card 1 in 10
            eventChance = Math.max((Math.floor(Math.random() * (11 - 1) + 1)), 1); // The maximum is exclusive and the minimum is inclusive
            previewDict["BROKEN PAINTBRUSH"] = [10, 0, 1];
        }
        
        // Add Event Item if eventChance = 1
        if (eventChance == 1) {
            itemDict["BROKEN PAINTBRUSH"] = 1;
        }

        // Setup itemText
        let itemText = "";

        // Add to itemText Based on the Item
        for ([name, amount] of Object.entries(itemDict)) {
            if (name.includes("SHARD")) itemText += `🔸 ${amount} - \`${name}\`\n`;
            else if (name.includes("GEM")) itemText += `🔶 ${amount} - \`${name}\`\n`;
            else if (name.includes("POKEDOLLAR")) itemText += `💴 ${amount} - \`${name}\`\n`;

            // Add Event Item to itemText
            else if (name.includes("BROKEN PAINTBRUSH")) itemText += `<:brokenBrush:1376696067982098544> 1 - \`BROKEN PAINTBRUSH\``;
        }

        // Setup previewText
        let previewText = "";

        // Add to previewText Based on the Item
        for ([name, amount] of Object.entries(previewDict)) {
            if (name.includes("SHARD")) previewText += `\`${amount[0]}%\`: 🔸 ${amount[1]} - ${amount[2]} \`${(cardData.item.type).toUpperCase()} ${name}\`\n`;
            else if (name.includes("GEM")) previewText += `\`${amount[0]}%\`: 🔶 ${amount[1]} - ${amount[2]} \`${(cardData.item.type).toUpperCase()} ${name}\`\n`;
            else if (name.includes("POKEDOLLAR")) previewText += `\`${amount[0]}%\`: 💴 ${amount[1]} - ${amount[2]} \`${name}\`\n`;

            // Add Event Item to previewText
            else if (name.includes("BROKEN PAINTBRUSH")) previewText += `\`${amount[0]}%\`: <:brokenBrush:1376696067982098544> ${amount[1]} - ${amount[2]} \`BROKEN PAINTBRUSH\``;
        }
        
        // Prepare Attachemnt and Embed
        attachment = new AttachmentBuilder(await makePokeImage(cardData.item, cardData), { name: 'poke-image.png' });
        releaseEmbed = makeReleaseEmbed(pokemonData, previewText, message.author, cardData.level > 0);
        await response.edit({ content: "", embeds: [releaseEmbed], files: [attachment], components: [makeButton()] });

        // Create Collector
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

        collector.on("collect", async i => {
            await i.deferUpdate();
            if (i.user != message.author) { return; }

            if (i.customId == "cancel") {
                // Create Cancel Embed
                releaseEmbed = makeReleaseEmbedCancel(pokemonData, previewText, message.author)
                response.edit({ content: " ", embeds: [releaseEmbed], files: [attachment], components: [] });
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

                // Remove Card Data
                card = await CardDatabase.findOne({ where: { card_id: cardData.item.card_id } });
                card.in_circulation--;
                card.save();

                userStat.card_released++;
                userStat.save()

                // Check Money Title
                checkOwnTitle(userStat, message);

                // Destroy Card
                UserCards.destroy({ where: { item_id: cardData.item_id } });

                // Create and Send Comfirm Embed
                releaseEmbed = makeReleaseEmbedConfirm(pokemonData, itemText, message.author)
                response.edit({ content: " ", embeds: [releaseEmbed], files: [attachment], components: [] });

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