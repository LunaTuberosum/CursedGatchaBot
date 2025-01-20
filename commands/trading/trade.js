const { EmbedBuilder, AttachmentBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { Users } = require("../../dbObjects");
const allCards = require("../../packs/allCards.json");
const { raritySymbol, makePokeImageTrade, checkSeriesCollect } = require("../../pullingObjects.js");

function makeEmbed(user, otherUser, cardInfo1, cardInfo2, pokemonData1, pokemonData2, checkUser) {
    const tradeEmebed = new EmbedBuilder()
        .setTitle("Card Trade")
        .setDescription(`${user}**${checkUser == 0 ? " ✅" : ""}\n${pokemonData1.card_id}-${pokemonData1.name}** - ${raritySymbol(pokemonData1.rarity)} - \`${cardInfo1.item_id}\` - \`${pokemonData1.series}\`\n\n ${otherUser}**${checkUser == 1 ? " ✅" : ""}\n${pokemonData2.card_id}-${pokemonData2.name}** - ${raritySymbol(pokemonData2.rarity)} - \`${cardInfo2.item_id}\` - \`${pokemonData2.series}\`\n`)
        .setImage(`attachment://poke-images.png`)

    return tradeEmebed;
}

function makeEmbedCancel(user, otherUser, cardInfo1, cardInfo2, pokemonData1, pokemonData2) {
    const tradeEmebed = new EmbedBuilder()
        .setTitle("Card Trade")
        .setColor("#bd0f0f")
        .setDescription(`${user}**\n${pokemonData1.card_id}-${pokemonData1.name}** - ${raritySymbol(pokemonData1.rarity)} - \`${cardInfo1.item_id}\` - \`${pokemonData1.series}\` - \`#${pokemonData1.poke_number}\`\n\n ${otherUser}**\n${pokemonData2.card_id}-${pokemonData2.name}** - ${raritySymbol(pokemonData2.rarity)} - \`${cardInfo2.item_id}\` - \`${pokemonData2.series}\` - \`#${pokemonData2.poke_number}\`\n\n**Trade was canceled.**`)
        .setImage(`attachment://poke-images.png`)

    return tradeEmebed;
}

function makeEmbedConfirm(user, otherUser, cardInfo1, cardInfo2, pokemonData1, pokemonData2) {
    const tradeEmebed = new EmbedBuilder()
        .setTitle("Card Trade")
        .setColor("#26bd0f")
        .setDescription(`${user}** ✅\n${pokemonData1.card_id}-${pokemonData1.name}** - ${raritySymbol(pokemonData1.rarity)} - \`${cardInfo1.item_id}\` - \`${pokemonData1.series}\` - \`#${pokemonData1.poke_number}\`\n\n ${otherUser}** ✅\n${pokemonData2.card_id}-${pokemonData2.name}** - ${raritySymbol(pokemonData2.rarity)} - \`${cardInfo2.item_id}\` - \`${pokemonData2.series}\` - \`#${pokemonData2.poke_number}\`\n\n**Trade was accepted.**`)
        .setImage(`attachment://poke-images.png`)

    return tradeEmebed;
}

function makeButton() {

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

function makeButtonConfirm() {

    const confirmButton = new ButtonBuilder()
        .setCustomId("confirm")
        .setStyle(ButtonStyle.Success)
        .setEmoji("✔")
        .setDisabled(true);

    const cancelButton = new ButtonBuilder()
        .setCustomId("cancel")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("✖");

    const finalConfirmButton = new ButtonBuilder()
        .setCustomId("finalConfirm")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("✔");

    const row = new ActionRowBuilder()
        .addComponents(confirmButton, cancelButton, finalConfirmButton);

    return row
}

function findCard(collection, cardCode) {
    for (const card of collection) {
        if (card.item_id == cardCode) {
            return card;
        }
    }
    return null;
}

module.exports = {
    cooldown: 5,
    name: 'trade',
    shortName: ['t'],
        
    async execute(message) {
        const response = await message.channel.send("Loading your trade...");

        let confirm = false;
        const splitMessage = message.content.split(" ");

        if (splitMessage.length < 4) {
            await response.edit(`${message.author}, you must specify the person your trading to, your card code, and their card code.`);
            return;
        }
        else if (splitMessage.length > 4) {
            await response.edit(`${message.author}, you must only specify the person your trading to, your card code, and their card code.`);
            return;
        }
        

        const user = await Users.findOne({ where: { user_id: message.author.id } });
        if (!user) { await response.edit(`${message.author}, you are not registered. Please register using \`g!register\`.`); return; }

        const otherUser = await Users.findOne({ where : { user_id: message.mentions.users.first().id } });

        if (user.user_id == otherUser.user_id) {
            await response.edit(`${message.author}, you can not trade to yourself.`);
            return;
        }

        if (!otherUser) {
            await response.edit(`${message.author}, that user can not be found. They must register first before they can be traded to or they do not exist.`);
            return;
        }

        const userCards = await user.getCards();
        const cardInfo1 = await findCard(userCards, splitMessage[2]);

        if (!cardInfo1) {
            await response.edit(`${message.author}, that card can not be found in your collection.`);
            return;
        }
        
        const pokemonData1 = cardInfo1.item;
        
        const otherUserCards = await otherUser.getCards();
        const cardInfo2 = await findCard(otherUserCards, splitMessage[3]);
        
        if (!cardInfo2) {
            await response.edit(`${message.author}, that card can not be found in ${splitMessage[1]} collection.`);
            return;
        }
        
        const pokemonData2 = cardInfo2.item;
        
        let attachment = new AttachmentBuilder(await makePokeImageTrade(pokemonData1, cardInfo1, pokemonData2, cardInfo2), { name: 'poke-images.png' });
        let checkUser = -1;
        
        await response.edit({ content: " ", embeds: [makeEmbed(message.author, splitMessage[1], cardInfo1, cardInfo2, pokemonData1, pokemonData2, checkUser)], files: [attachment], components: [makeButton()] });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120_000 });

        let otherConfirmUser;

        collector.on("collect", async i => {
            if (i.user.id == user.user_id) { null }
            else if (i.user.id == otherUser.user_id) { null }
            else { i.deferUpdate(); return; }
            await i.deferUpdate();

            if(i.customId == "cancel") {
                collector.stop();
            }
            if (i.customId == "confirm") {
                if (i.user.id == user.user_id) { otherConfirmUser = otherUser; checkUser = 0; }
                else if (i.user.id == otherUser.user_id) { otherConfirmUser = user; checkUser = 1; }

                await response.edit({ embeds: [makeEmbed(message.author, splitMessage[1], cardInfo1, cardInfo2, pokemonData1, pokemonData2, checkUser)], files: [attachment], components: [makeButtonConfirm()] });

            }
            if (i.customId == "finalConfirm" && i.user.id == otherConfirmUser.user_id) {

                cardInfo2.user_id = user.user_id;
                cardInfo2.tag = "None";
                cardInfo2.save();
                checkSeriesCollect(await user.getCards(), cardInfo2.item.series, message, message.author);

                cardInfo1.user_id = otherUser.user_id;
                cardInfo1.tag = "None";
                cardInfo1.save();
                checkSeriesCollect(await otherUser.getCards(), cardInfo1.item.series, message, message.mentions.users.first());

                await response.edit({ embeds: [makeEmbedConfirm(message.author, splitMessage[1], cardInfo1, cardInfo2, pokemonData1, pokemonData2)], files: [attachment], components: [] });
            }
        });

        collector.on("end", async i => {
            await response.edit({ embeds: [makeEmbedCancel(message.author, splitMessage[1], cardInfo1, cardInfo2, pokemonData1, pokemonData2)], files: [attachment], components: [] });
        })


    },
};