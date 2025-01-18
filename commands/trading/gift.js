const { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { Users, UserCards, CardDatabase } = require("../../dbObjects");
const { formatName, raritySymbol, makePokeImage } = require("../../pullingObjects");

function makeEmbed(user, otherUser, pokemonData, card, checkUser) {
    const giftEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Gift Card`)
        .setDescription(`${user}${checkUser == 0 ? " ✅" : ""} **-->** ${otherUser}${checkUser == 1 ? " ✅" : ""}\n\n**${formatName(pokemonData)}** - **${raritySymbol(pokemonData.rarity)}** - \`${card.item_id}\` - \`${pokemonData.series}\``)
        .setImage(`attachment://poke-image.png`)
    return giftEmbed;
}

function makeEmbedCancel(user, otherUser, pokemonData, card) {
    const giftEmbed = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setTitle(`Gift Card`)
        .setDescription(`${user} **-->** ${otherUser}\n\n**${formatName(pokemonData)}** - **${raritySymbol(pokemonData.rarity)}** - \`${card.item_id}\` - \`${pokemonData.series}\`\n\n**Gift was canceled.**`)
        .setImage(`attachment://poke-image.png`)
    return giftEmbed;
}

function makeEmbedConfirm(user, otherUser, pokemonData, card) {
    const giftEmbed = new EmbedBuilder()
        .setColor("#26bd0f")
        .setTitle(`Gift Card`)
        .setDescription(`${user} ✅ **-->** ${otherUser} ✅\n\n**${formatName(pokemonData)}** - **${raritySymbol(pokemonData.rarity)}** - \`${card.item_id}\` - \`${pokemonData.series}\`\n\n**Gift was accepted.**`)
        .setImage(`attachment://poke-image.png`)
    return giftEmbed;
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

module.exports = {
    cooldown: 5,
    name: 'gift',
    shortName: ['g', "give"],
        
    async execute(message) {
        const response = await message.channel.send("Creating your gift...");

        const splitMessage = message.content.split(" ");

        if (splitMessage.length < 3) {
            await response.edit({ content: `${message.author}, you must specify the person you are gifting to and the card you are gifting.` });
            return;
        }

        if (splitMessage.length < 3) {
            await response.edit({ content: `${message.author}, you must specify the person you are gifting to and the card you are gifting. You can only gift one card at a time.` });
            return;
        }

        const user = await Users.findOne({ where: { user_id: message.author.id } });
        if (!user) { await response.edit(`${message.author}, you are not registered. Please register using \`g!register\`.`); return; }

        const card = await UserCards.findOne({ where: { user_id: user.user_id, item_id: splitMessage[2].toLowerCase() } });

        if (!card) { await response.edit(`${message.author}, that card is either not in possesion or it does not exist. Please enter vaild card code.`); return; }

        const pokemonData = await CardDatabase.findOne({ where: { id: card.item_info } });

        if (!pokemonData) { await response.edit(`${message.author}, the pokemon attatched to that card could not be found. Please contact an admin.`); return; }

        const otherUser = await Users.findOne({ where : { user_id: message.mentions.users.first().id } });
        if (!otherUser) { await response.edit({ content: `${message.author}, that user can not be found. They must register first before they can be traded to or they do not exist.` }); return; }

        let otherConfirmUser;
        let checkUser = -1;

        const attachment = new AttachmentBuilder(await makePokeImage(pokemonData, card), { name: 'poke-image.png' });

        await response.edit({ embeds: [makeEmbed(message.author, message.mentions.users.first(), pokemonData, card, checkUser)], files: [attachment], components: [makeButton()] });
        
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120_000 });

        collector.on("collect", async i => {
            if (i.user.id == user.user_id) { null }
            else if (i.user.id == otherUser.user_id) { null }
            else { i.deferUpdate(); return; }

            if(i.customId == "cancel") {
                collector.stop();
                i.deferUpdate();
            }
            if (i.customId == "confirm") {
                if (i.user.id == user.user_id) { otherConfirmUser = otherUser; checkUser = 0; }
                else if (i.user.id == otherUser.user_id) { otherConfirmUser = user; checkUser = 1; }

                await response.edit({ embeds: [makeEmbed(message.author, message.mentions.users.first(), pokemonData, card, checkUser)], files: [attachment], components: [makeButtonConfirm()] });
                i.deferUpdate();

            }
            if (i.customId == "finalConfirm" && i.user.id == otherConfirmUser.user_id) {

                card.user_id = otherUser.user_id;
                card.save();

                collector.stop();
                await response.edit({ embeds: [makeEmbedConfirm(message.author, message.mentions.users.first(), pokemonData, card)], files: [attachment], components: [] });
                i.deferUpdate();
            }
        });

        collector.on("end", async i => {
            await response.edit({ embeds: [makeEmbedCancel(message.author, message.mentions.users.first(), pokemonData, card)], files: [attachment], components: [] });
        })
    }
}