const { EmbedBuilder, AttachmentBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { Users, UserCards, CardDatabase } = require("../../dbObjects");
const allCards = require("../../packs/allCards.json");
const { rarityStars } = require("../../pullingObjects.js");
const Canvas = require('@napi-rs/canvas');

function makeEmbed(user, otherUser, cardInfo1, cardInfo2, pokemonData1, pokemonData2) {
    const tradeEmebed = new EmbedBuilder()
        .setTitle("Card Trade")
        .setDescription(`${user}\n**${pokemonData1["CardID"]}-${pokemonData1["Name"]}** - ${rarityStars(pokemonData1["Rarity"])} - \`${cardInfo1.item_id}\` - \`${pokemonData1["Series"]}\` - \`#${pokemonData1["Poke#"]}\`\n\n ${otherUser}\n**${pokemonData2["CardID"]}-${pokemonData2["Name"]}** - ${rarityStars(pokemonData2["Rarity"])} - \`${cardInfo2.item_id}\` - \`${pokemonData2["Series"]}\` - \`#${pokemonData2["Poke#"]}\`\n`)
        .setImage(`attachment://poke-images.png`)

    return tradeEmebed;
}

function makeEmbedCancel(user, otherUser, cardInfo1, cardInfo2, pokemonData1, pokemonData2) {
    const tradeEmebed = new EmbedBuilder()
        .setTitle("Card Trade")
        .setColor("#bd0f0f")
        .setDescription(`${user}\n**${pokemonData1["CardID"]}-${pokemonData1["Name"]}** - ${rarityStars(pokemonData1["Rarity"])} - \`${cardInfo1.item_id}\` - \`${pokemonData1["Series"]}\` - \`#${pokemonData1["Poke#"]}\`\n\n${otherUser}\n**${pokemonData2["CardID"]}-${pokemonData2["Name"]}** - ${rarityStars(pokemonData2["Rarity"])} - \`${cardInfo2.item_id}\` - \`${pokemonData2["Series"]}\` - \`#${pokemonData2["Poke#"]}\`\n\n**Trade was canceled.**`)
        .setImage(`attachment://poke-images.png`)

    return tradeEmebed;
}

function makeEmbedConfirm(user, otherUser, cardInfo1, cardInfo2, pokemonData1, pokemonData2) {
    const tradeEmebed = new EmbedBuilder()
        .setTitle("Card Trade")
        .setColor("#26bd0f")
        .setDescription(`${user}\n**${pokemonData1["CardID"]}-${pokemonData1["Name"]}** - ${rarityStars(pokemonData1["Rarity"])} - \`${cardInfo1.item_id}\` - \`${pokemonData1["Series"]}\` - \`#${pokemonData1["Poke#"]}\`\n\n${otherUser}\n**${pokemonData2["CardID"]}-${pokemonData2["Name"]}** - ${rarityStars(pokemonData2["Rarity"])} - \`${cardInfo2.item_id}\` - \`${pokemonData2["Series"]}\` - \`#${pokemonData2["Poke#"]}\`\n\n**Trade was accepted.**`)
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
        let confirm = false;
        const splitMessage = message.content.split(" ");

        if (splitMessage.length < 4) {
            await message.channel.send(`${message.author}, you must specify the person your trading to, your card code, and their card code.`);
            return;
        }
        else if (splitMessage.length > 4) {
            await message.channel.send(`${message.author}, you must only specify the person your trading to, your card code, and their card code.`);
            return;
        }
        

        const user = await Users.findOne({ where: { user_id: message.author.id } });

        const otherUser = await Users.findOne({ where : { user_id: message.mentions.users.first().id } });

        if (user.user_id == otherUser.user_id) {
            await message.channel.send(`${message.author}, you can not trade to yourself.`);
            return;
        }

        if (!otherUser) {
            await message.channel.send(`${message.author}, that user can not be found. They must register first before they can be traded to or they do not exist.`);
            return;
        }

        const userCards = await user.getCards();
        const cardInfo1 = findCard(userCards, splitMessage[2]);

        if (!cardInfo1) {
            await message.channel.send(`${message.author}, that card can not be found in your collection.`);
            return;
        }

        const pokemonData1 = allCards[cardInfo1.item.name];
        
        const otherUserCards = await otherUser.getCards();
        const cardInfo2 = findCard(otherUserCards, splitMessage[3]);

        if (!cardInfo2) {
            await message.channel.send(`${message.author}, that card can not be found in ${splitMessage[1]} collection.`);
            return;
        }

        const pokemonData2 = allCards[cardInfo2.item.name];

        const canvas = Canvas.createCanvas(1840, 1490);
        const context = canvas.getContext('2d');

        const img1 = await Canvas.loadImage(`./pokeImages/${pokemonData1["CardID"]}-${pokemonData1["Name"]}.png`);
        const img2 = await Canvas.loadImage(`./pokeImages/${pokemonData2["CardID"]}-${pokemonData2["Name"]}.png`);  
        const trade = await Canvas.loadImage(`./resources/trade.png`);  

        context.drawImage(img1, 0, 100, img2.width, img1.height);
        context.drawImage(trade, 720, 545, trade.width, trade.height);
        context.drawImage(img2, 1120, 100, img2.width, img2.height);

        let attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'poke-images.png' });

        const response = await message.channel.send({ embeds: [makeEmbed(message.author, splitMessage[1], cardInfo1, cardInfo2, pokemonData1, pokemonData2)], files: [attachment], components: [makeButton()] });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15_000 });

        collector.on("collect", async i => {
            if (i.user == message.mentions.users.first() || i.user == message.author) {
                if(i.customId == "cancel") {
                    await response.edit({ embeds: [makeEmbedCancel(message.author, splitMessage[1], cardInfo1, cardInfo2, pokemonData1, pokemonData2)], files: [attachment], components: [] });
                    i.deferUpdate();
                }
            }
            if (i.user == message.mentions.users.first()) {
                if (i.customId == "confirm") {
                    await response.edit({ embeds: [makeEmbed(message.author, splitMessage[1], cardInfo1, cardInfo2, pokemonData1, pokemonData2)], files: [attachment], components: [makeButtonConfirm()] });
                    i.deferUpdate();
                }
            }
            else if (i.user == message.author) {
                if (i.customId == "finalConfirm") {

                    cardInfo2.user_id = user.user_id;
                    cardInfo2.save();

                    cardInfo1.user_id = otherUser.user_id;
                    cardInfo1.save();

                    await response.edit({ embeds: [makeEmbedConfirm(message.author, splitMessage[1], cardInfo1, cardInfo2, pokemonData1, pokemonData2)], files: [attachment], components: [] });
                    i.deferUpdate();
                }
            }
        
        });


    },
};