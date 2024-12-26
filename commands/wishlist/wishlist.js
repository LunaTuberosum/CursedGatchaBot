const { EmbedBuilder, ButtonBuilder, ButtonStyle, ComponentType, ActionRowBuilder } = require('discord.js');
const { CardDatabase, Wishlists } = require('../../dbObjects.js');
const { formatName } = require("../../pullingObjects.js");
const allCards = require("../../packs/allCards.json");

function makeWishlistEmbed(wishlistArray, user, start, end ,total) {
    
    const wishlistEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle("Wishlist")
        .setDescription(`Wishlist of ${user}\n \
        ${wishlistArray.join("")}`)
        .setFooter({ text: `Showing wishlist cards ${start}-${end} of ${total}`})

    return wishlistEmbed;
}

function makeWishlistEmbedEmpty(user) {

    const wishlistEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle("Wishlist")
        .setDescription(`Wishlist of ${user}\n \
        \n**Your wishlist is empty.**`)
        .setFooter({ text: `Showing wishlist cards 0-0 of 0`})

    return wishlistEmbed;
}

function makeButton() {

    const leftButton = new ButtonBuilder()
        .setCustomId("left")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("◀️")
        .setDisabled(true);

    const rightButton = new ButtonBuilder()
        .setCustomId("right")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("▶️");

    const row = new ActionRowBuilder()
        .addComponents(leftButton, rightButton);

    return row;
}

async function getArray(userWishlist, start, end) {
    let i = 1;
    wishlistArray = []
    for (const wish of userWishlist) {
        if (i > end) {
            break;
        }
        else if(i >= start) {
            const card = await CardDatabase.findOne({ where: { card_id: wish.card_id, card_type: wish.card_type } });
            const pokemonData = card
            wishlistArray.push(`\n${pokemonData.series} - **${formatName(pokemonData)}**`);
        }
        i++;
    }

    return wishlistArray;
}

function checkButtons(buttons, start, end, userWishlist) {
    buttons.components[0].setDisabled(false);
    buttons.components[1].setDisabled(false);
    if (start == 1) {
        buttons.components[0].setDisabled(true);
    }
    else if (end == userWishlist.length) {
        buttons.components[1].setDisabled(true);
    }
}

module.exports = {
    name: "wishlist",
    shortName: ["w"],
        
    async execute(message) {

        const userWishlist = await Wishlists.findAll({ where: { user_id: message.author.id } });

        if (userWishlist.length == 0) {
            await message.channel.send({ embeds: [makeWishlistEmbedEmpty(message.author)] });
            return;
        }
        else if (userWishlist.length > 10) {

            let start = 1;
            let end = 10;

            let wishlistArray = await getArray(userWishlist, start, end);

            const buttons = makeButton();
            const response = await message.channel.send({ embeds: [makeWishlistEmbed(wishlistArray, message.author, start, end, userWishlist.length)], components: [buttons] });

            const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

            collector.on("collect", async i => {

                if (i.user == message.author) {
                    if (i.customId == "left") {
                        if (start - 10 < 1) {
                            start = 1;
                            end = 10;
                        }
                        else {
                            start -= 10;
                            end -= 10;
                        }
                        checkButtons(buttons, start, end, userWishlist);

                        wishlistArray = await getArray(userWishlist, start, end);
                        await response.edit({ embeds: [makeWishlistEmbed(wishlistArray, message.author, start, end, userWishlist.length)], components: [buttons] });
                        i.deferUpdate();

                    }
                    else if (i.customId == "right") {
                        if (end + 10 > userWishlist.length) {
                            start += userWishlist.length - end;
                            end = userWishlist.length;
                        }
                        else {
                            start += 10;
                            end += 10;
                        }
                        checkButtons(buttons, start, end, userWishlist);

                        wishlistArray = await getArray(userWishlist, start, end);
                        await response.edit({ embeds: [makeWishlistEmbed(wishlistArray, message.author, start, end, userWishlist.length)], components: [buttons] });
                        i.deferUpdate();
                    }
                }
            });


        }
        else {
            const wishlistArray = [];
            for (const wish of userWishlist) {
                const card = await CardDatabase.findOne({ where: { card_id: wish.card_id, card_type: wish.card_type } });
                const pokemonData = card
                wishlistArray.push(`\n${pokemonData.series} - **${formatName(pokemonData)}**`);
            }

            const wishlistEmbed = makeWishlistEmbed(wishlistArray, message.author, 1, userWishlist.length, userWishlist.length);
            message.channel.send({ embeds: [wishlistEmbed] })
        }
        
    }
};