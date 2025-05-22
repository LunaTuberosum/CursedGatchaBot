const { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { Users, UserCards, ItemShop, CardDatabase, UserStats, TitleDatabase, UserTitles, Tags } = require("../../dbObjects.js");
const allCards = require("../../packs/allCards.json");
const { makePokeImage, formatName } = require("../../pullingObjects.js");
const { getReleaseReward } = require("../../affectionObjects.js");
const { checkOwnTitle } = require("../../imageObjects.js");
const { splitContent } = require("../../commandObjects.js");

function makeReleaseEmbed(relaeseText, itemText, user, warningText) {
    const releaseEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle("Multi Release Cards")
        .setDescription(`${user}, say goodbye to:\n\`\`\`${relaeseText}\`\`\`\nThey will leave behind for you:\n\`\`\`${itemText}\`\`\`\n${warningText}`)

    return releaseEmbed;
}

function makeReleaseEmbedCancel(relaeseText, itemText, user) {
    const releaseEmbed = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setTitle("Multi Release Cards")
        .setDescription(`${user}, say goodbye to:\n\`\`\`${relaeseText}\`\`\`\nThey will leave behind for you:\n\`\`\`${itemText}\`\`\`\n**The release has been canceled.**`)

    return releaseEmbed;
}

function makeReleaseEmbedConfirm(relaeseText, itemText, user) {
    const releaseEmbed = new EmbedBuilder()
        .setColor("#26bd0f")
        .setTitle("Multi Release Cards")
        .setDescription(`${user}, say goodbye to:\n\`\`\`${relaeseText}\`\`\`\nThey will leave behind for you:\n\`\`\`${itemText}\`\`\`\n**The card has been released.**`)

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
        const response = await message.channel.send("Preparing for release...");

        const splitMessage = splitContent(message);

        const user = await Users.findOne({ where: { user_id: message.author.id } });
        if (!user) { await response.edit(`${message.author}, you are not registered. Please register using \`g!register\`.`); return; }

        const userStat = await UserStats.findOne({ where: { user_id: user.user_id } });

        const userCards = await user.getCards();

        if (userCards.length == 0) {
            response.edit(`${message.author} you have not cards to release.`);
            return;
        }

        let cardData = [];
        let releaseData = [];
        let releaseEmbed;

        if (splitMessage.length == 1) {
            await response.edit({ content: `${message.author}, you must specify the cards or tags you wish to release.` });
            return;
        }

        const subSting = splitMessage.slice(1)

        for (const _sub of subSting) {
            const tag = await Tags.findOne({ where: { user_id: user.user_id, name: _sub } });

            if(tag) {
                for (const _card of userCards) {
                    if (_card.tag == tag.name) { cardData.push(_card); releaseData.push(getReleaseReward(_card)); }
                }
                continue;
            }

            for (const _card of userCards) {
                if (_card.item_id == _sub) { cardData.push(_card); releaseData.push(getReleaseReward(_card)); continue; }
            }
            
        }

        let releaseText = "";
        let warningText = "";

        const itemDict = {
            "POKEDOLLAR": 0
        };
        let index = 0;
        for (const card of cardData) {
            for ([name, amount] of Object.entries(releaseData[index])) {
                
                if (name == "SHARD" || name == "GEM") {
                    if (itemDict[`${(card.item.type).toUpperCase()} ${name}`]) itemDict[`${(card.item.type).toUpperCase()} ${name}`] += amount;
                    else itemDict[`${(card.item.type).toUpperCase()} ${name}`] = amount;
                }
                else itemDict["POKEDOLLAR"] += amount;
            }

            if (card.level > 0) warningText = "### One or more of cards are leveled. Are you sure you want to release these?";

            if (index == 6) releaseText += "...";
            else if (index > 6) continue;
            else releaseText += `${card.item_id} - ${formatName(card.item)}\n`;

            index++;
        }

        if (cardData.length == 0) {
            await response.edit(`${message.author}, the tag you entered is empty, dosen't exist, or the card you entered isn't yours or dosen't exist.`);
            return;
        }

        let itemText = "";
        for ([name, amount] of Object.entries(itemDict)) {
            if (name.includes("SHARD")) itemText += `🔸 ${amount} - ${name}\n`;
            else if (name.includes("GEM")) itemText += `🔶 ${amount} - ${name}\n`;
            else if (name.includes("POKEDOLLAR")) itemText += `💴 ${amount} - ${name}\n`;
        }

        
        releaseEmbed = makeReleaseEmbed(releaseText, itemText, message.author, warningText);
        await response.edit({ content: "", embeds: [releaseEmbed], components: [makeButton()] });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

        collector.on("collect", async i => {
            await i.deferUpdate();
            if (i.user != message.author) { return; }

            if (i.customId == "cancel") {
                releaseEmbed = makeReleaseEmbedCancel(releaseText, itemText, message.author)
                response.edit({ content: " ", embeds: [releaseEmbed], components: [] });
            }
            else if (i.customId == "release") {

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
                }

                for (const card of cardData) {
                    const _card = await CardDatabase.findOne({ where: { card_id: card.item.card_id } });
                    _card.in_circulation--;
                    _card.save();

                    UserCards.destroy({ where: { item_id: card.item_id } });
                    userStat.card_released++;
                }

                userStat.save()

                checkOwnTitle(userStat, message);

                releaseEmbed = makeReleaseEmbedConfirm(releaseText, itemText, message.author)
                response.edit({ content: " ", embeds: [releaseEmbed], components: [] });

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