const { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { Users, UserCards, UserItems, ItemShop, CardDatabase } = require("../../dbObjects.js");
const allCards = require("../../packs/allCards.json");
const { addBalance } = require("../../pullingObjects.js");
const { getLevelUpCost } = require("../../affectionObjects.js");

function makeReleaseEmbed(cardInfo, releaseData, user) {
    const releaseEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setThumbnail(`attachment://${cardInfo["CardID"]}-${cardInfo["Name"]}.png`)
        .setTitle("Release Card")
        .setDescription(`${user}, **${cardInfo["Name"]}** will leave behind for you:\n\n:yen: **${releaseData["Money"]}** - \`POKEDOLLARS\`\n:small_orange_diamond: **${releaseData["Resource"]["Amount"]}** - \`${(cardInfo["Type"]).toUpperCase()} ${releaseData["Resource"]["Type"]}\``)

    return releaseEmbed;
}

function makeReleaseEmbedCancel(cardInfo, releaseData, user) {
    const releaseEmbed = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setThumbnail(`attachment://${cardInfo["CardID"]}-${cardInfo["Name"]}.png`)
        .setTitle("Release Card")
        .setDescription(`${user}, **${cardInfo["Name"]}** will leave behind for you:\n\n:yen: **${releaseData["Money"]}** - \`POKEDOLLARS\`\n:small_orange_diamond: **${releaseData["Resource"]["Amount"]}** - \`${(cardInfo["Type"]).toUpperCase()} ${releaseData["Resource"]["Type"]}\`\n\n**Card Release has been canceled.**`)

    return releaseEmbed;
}

function makeReleaseEmbedConfirm(cardInfo, releaseData, user) {
    const releaseEmbed = new EmbedBuilder()
        .setColor("#26bd0f")
        .setThumbnail(`attachment://${cardInfo["CardID"]}-${cardInfo["Name"]}.png`)
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
    
    for ( const pName of Object.keys(allCards)) {
        if(pName == card) {
            return allCards[pName];
        }
    }
}

module.exports = {
    cooldown: 5,
    name: 'release',
    shortName: ['r'],
        
    async execute(message) {
        const splitMessage = message.content.split(" ");

        const user = await Users.findOne({ where: { user_id: message.author.id } });
        if (!user) { await message.channel.send(`${message.author}, you are not registered. Please register using \`g!register\`.`); return; }

        const userCards = await user.getCards();

        if (userCards.length == 0) {
            message.channel.send(`${message.author} you have not cards to release.`);
            return;
        }

        let pokemonData;
        let cardData;
        let releaseEmbed;
        let attachment;
        let response =  await message.channel.send("...");

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
        
        attachment = new AttachmentBuilder(`./pokeImages/${pokemonData["CardID"]}-${pokemonData["Name"]}.png`);
        releaseEmbed = makeReleaseEmbed(pokemonData, releaseData, message.author);
        await response.edit({ content: "", embeds: [releaseEmbed], files: [attachment], components: [makeButton()] });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

        collector.on("collect", async i => {
            if (i.user == message.author) {
                if (i.customId == "cancel") {
                    releaseEmbed = makeReleaseEmbedCancel(pokemonData, releaseData, message.author)
                    response.edit({ content: "", embeds: [releaseEmbed], files: [attachment], components: [] });
                }
                else if (i.customId == "release") {

                    item = await ItemShop.findOne({ where: { name: `${(pokemonData["Type"]).toUpperCase()} ${releaseData["Resource"]["Type"]}` } });
                    user.addItem(item, releaseData["Resource"]["Amount"]);

                    item = await ItemShop.findOne({ where: { name: "POKEDOLLAR" } });
                    user.addItem(item, releaseData["Money"]);
                    
                    card = await CardDatabase.findOne({ where: { card_id: cardData.item.card_id } });
                    card.in_circulation--;
                    card.save();

                    UserCards.destroy({ where: { item_id: cardData.item_id } });

                    releaseEmbed = makeReleaseEmbedConfirm(pokemonData, releaseData, message.author)
                    response.edit({ content: "", embeds: [releaseEmbed], files: [attachment], components: [] });
                }
            }
        });

    },
};