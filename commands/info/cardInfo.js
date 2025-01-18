const { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { Users, CardDatabase, Wishlists, UserCards } = require("../../dbObjects.js");
const { raritySymbol, makePokeImage, formatName } = require("../../pullingObjects.js");

function makeCardImageEmbed(pokemonData, cardCode, user) {
    const cardImageEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setImage(`attachment://poke-image.png`)
        .setTitle("Card Info")
        .setDescription(`Owned by ${user}\n\n**${formatName(pokemonData)}** - \`${cardCode}\` - \`${pokemonData.rarity}\` - \`${pokemonData.series}\` - \`#${pokemonData.poke_number}\``)
        .setFooter( { text: `Drawn on: ${pokemonData.drawn_date}` })

    return cardImageEmbed;
}

function makeCardStatEmbed(pokemonData, wishlistInfo) {

    const cardStatEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setThumbnail(`attachment://poke-image.png`)
        .setTitle("Card Info")
        .setDescription(` **Pokemon** - ${formatName(pokemonData)}\n**Series** - ${pokemonData.series}\n**Rarity** - ${pokemonData.rarity} [${raritySymbol(pokemonData.rarity)}]\n**Card Type** - ${pokemonData.card_type}\n**Wishlisted** - ${wishlistInfo}\n\n**Time Pulled** - ${pokemonData.times_pulled}\n**Cards in Circulation** - ${pokemonData.in_circulation}\n\n**Poke #** - ${pokemonData.poke_number}\n**Day Drawn** - ${pokemonData.drawn_date}\n**Type** - ${pokemonData.type}`)

    return cardStatEmbed;
}

function makeButtonImage() {

    const cardStatButton = new ButtonBuilder()
        .setCustomId("stat")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("📊");

    const row = new ActionRowBuilder()
        .addComponents(cardStatButton);

    return row;
}

function makeButtonStat() {

    const cardImageButton = new ButtonBuilder()
        .setCustomId("image")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🖼️");

    const row = new ActionRowBuilder()
        .addComponents(cardImageButton);

    return row;
}

module.exports = {
    name: "cardinfo",
    shortName: ["ci"],
        
    async execute(message) {

        const response = await message.channel.send("Loading the info...");

        const splitMessage = message.content.split(" ");

        let imageEmbed;
        let statEmbed;
        let attachment;
        let pokemonData;

        if (splitMessage.length > 1) {
            if (splitMessage[1].length == 6) {
                
                const card = await UserCards.findOne({ where: { item_id: splitMessage[1] } });
                
                if (!card) {return}

                let owner = message.client.users.fetch(card.user_id);
                owner.then( async function(r) {
                    pokemonData = await CardDatabase.findOne({ where: { id: card.item_info }});

                    attachment = new AttachmentBuilder(await makePokeImage(pokemonData, card), { name: 'poke-image.png' });
                    imageEmbed = makeCardImageEmbed(pokemonData, splitMessage[1], r);
                    statEmbed = makeCardStatEmbed(pokemonData, (await Wishlists.findAll({ where: { card_id: pokemonData.card_id } })).length);
                    await response.edit({ content: "", embeds: [imageEmbed], components: [makeButtonImage()], files: [attachment] });
 
                } )

            }
            else {
                await response.edit({ content: `${message.author} please enter a valid card code.` });
                return;
            }
            
        } else {
            
            const user = await Users.findOne({ where: { user_id: message.author.id } });

            const userCards = await user.getCards();
            const lastItem = userCards[userCards.length - 1];

            pokemonData = lastItem.item;

            attachment = new AttachmentBuilder(await makePokeImage(pokemonData, lastItem), { name: 'poke-image.png' });
            imageEmbed = makeCardImageEmbed(pokemonData, lastItem.item_id, message.author);
            statEmbed = makeCardStatEmbed(pokemonData, (await Wishlists.findAll({ where: { user_id: message.author.id, card_id: pokemonData.card_id } })).length);
            await response.edit({ content: "", embeds: [imageEmbed], components: [makeButtonImage()], files: [attachment] });
        }
        
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

        collector.on("collect", async i => {
            if (i.user == message.author) {
                if (i.customId == "stat") {
                    response.edit({ content: "", embeds: [statEmbed], components: [makeButtonStat()], files: [attachment] });
                    i.deferUpdate();
                }
                else if (i.customId == "image") {
                    response.edit({ content: "", embeds: [imageEmbed], components: [makeButtonImage()], files: [attachment] });
                    i.deferUpdate();
                }
            }
        });
    }
};