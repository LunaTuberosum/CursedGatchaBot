const { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { Users, UserCards, UserItems, ItemShop, CardDatabase, UserStats, TitleDatabase, UserTitles } = require("../../dbObjects.js");
const allCards = require("../../packs/allCards.json");
const { addBalance, makePokeImage } = require("../../pullingObjects.js");
const { getLevelUpCost } = require("../../affectionObjects.js");
const { checkOwnTitle } = require("../../imageObjects.js");
const { splitContent } = require("../../commandObjects.js");

function makeReleaseEmbed(cardInfo, releaseData, user) {
    const releaseEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setThumbnail(`attachment://poke-image.png`)
        .setTitle("Release Card")
        .setDescription(`${user}, **${cardInfo["Name"]}** will leave behind for you:\n\n:yen: **${releaseData["Money"]}** - \`POKEDOLLARS\`\n:small_orange_diamond: **${releaseData["Resource"]["Amount"]}** - \`${(cardInfo["Type"]).toUpperCase()} ${releaseData["Resource"]["Type"]}\``)

    return releaseEmbed;
}

function makeReleaseEmbedCancel(cardInfo, releaseData, user) {
    const releaseEmbed = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setThumbnail(`attachment://poke-image.png`)
        .setTitle("Release Card")
        .setDescription(`${user}, **${cardInfo["Name"]}** will leave behind for you:\n\n:yen: **${releaseData["Money"]}** - \`POKEDOLLARS\`\n:small_orange_diamond: **${releaseData["Resource"]["Amount"]}** - \`${(cardInfo["Type"]).toUpperCase()} ${releaseData["Resource"]["Type"]}\`\n\n**Card Release has been canceled.**`)

    return releaseEmbed;
}

function makeReleaseEmbedConfirm(cardInfo, releaseData, user) {
    const releaseEmbed = new EmbedBuilder()
        .setColor("#26bd0f")
        .setThumbnail(`attachment://poke-image.png`)
        .setTitle("Release Card")
        .setDescription(`${user}, **${cardInfo["Name"]}** will leave behind for you:\n\n:yen: **${releaseData["Money"]}** - \`POKEDOLLARS\`\n:small_orange_diamond: **${releaseData["Resource"]["Amount"]}** - \`${(cardInfo["Type"]).toUpperCase()} ${releaseData["Resource"]["Type"]}\`\n\n**The card has been released.**`)

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
    name: 'release',
    shortName: ['r'],
        
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

        let pokemonData;
        let cardData;
        let releaseEmbed;
        let attachment;

        if (splitMessage.length > 1) {
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

            cardData = userCards[userCards.length - 1];
        }

        pokemonData = findCardInCollection(cardData.item.name);            
        releaseData = getLevelUpCost(cardData)
        
        attachment = new AttachmentBuilder(await makePokeImage(cardData.item, cardData), { name: 'poke-image.png' });
        releaseEmbed = makeReleaseEmbed(pokemonData, releaseData, message.author);
        await response.edit({ content: "", embeds: [releaseEmbed], files: [attachment], components: [makeButton()] });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

        collector.on("collect", async i => {
            if (i.user == message.author) {
                await i.deferUpdate();
                if (i.customId == "cancel") {
                    releaseEmbed = makeReleaseEmbedCancel(pokemonData, releaseData, message.author)
                    response.edit({ content: " ", embeds: [releaseEmbed], files: [attachment], components: [] });
                }
                else if (i.customId == "release") {

                    item = await ItemShop.findOne({ where: { name: `${(pokemonData["Type"]).toUpperCase()} ${releaseData["Resource"]["Type"]}` } });
                    user.addItem(item, releaseData["Resource"]["Amount"]);

                    item = await ItemShop.findOne({ where: { name: "POKEDOLLAR" } });
                    user.addItem(item, releaseData["Money"]);

                    
                    card = await CardDatabase.findOne({ where: { card_id: cardData.item.card_id } });
                    card.in_circulation--;
                    card.save();

                    userStat.card_released++;
                    userStat.money_own = userStat.money_own + Number(releaseData["Money"]);
                    userStat.save()

                    checkOwnTitle(userStat, message);

                    UserCards.destroy({ where: { item_id: cardData.item_id } });

                    releaseEmbed = makeReleaseEmbedConfirm(pokemonData, releaseData, message.author)
                    response.edit({ content: " ", embeds: [releaseEmbed], files: [attachment], components: [] });

                    if (userStat.card_released == 100) {
                        const titleData = await TitleDatabase.findOne({ where: { name: "Catch and Release" } });

                        if (!titleData) { return; }

                        const userTitle = await UserTitles.findOne({ where: { user_id: message.author.id, title_id: titleData.id } });
                        
                        if (userTitle) { return; }

                        await UserTitles.create({ user_id: message.author.id, title_id: titleData.id });

                        await message.channel.send(`${message.author}, you have released 100 cards! You have gained the title: \`${titleData.name}\``)
                    }
                    
                }
            }
        });

    },
};