const { EmbedBuilder, AttachmentBuilder, ComponentType, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const { CardDatabase, Wishlists } = require("../../dbObjects");
const { formatName, raritySymbol, makePokeImage } = require("../../pullingObjects");

function makeEmbed(pokemonData, wishlistInfo) {

    const embed = new EmbedBuilder()
        .setColor("#616161")
        .setImage(`attachment://poke-image.png`)
        .setTitle(`Pokedex - ${formatName(pokemonData)}`)
        .setDescription(`**Series** - ${pokemonData.series}\n**Rarity** - ${pokemonData.rarity} [${raritySymbol(pokemonData.rarity)}]\n**Card Type** - ${pokemonData.card_type}\n**Wishlisted** - ${wishlistInfo}\n\n**Time Pulled** - ${pokemonData.times_pulled}\n**Cards in Circulation** - ${pokemonData.in_circulation}\n\n**Poke #** - ${pokemonData.poke_number}\n**Day Drawn** - ${pokemonData.drawn_date}\n**Type** - ${pokemonData.type}\n\n**Get** - ${pokemonData.obtain}`)

    return embed;
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

module.exports = {
    name: "pokedex",
    shortName: ["pd"],
        
    async execute(message) {
        const response = await message.channel.send("Loading the data...");

        const splitMessage = message.content.split(" ");

        if (splitMessage.length != 2) { await response.edit(`${message.author}, please enter the name of the pokemon you'd like to lookup`); return; }

        const pokeName = `${splitMessage[1][0].toUpperCase()}${splitMessage[1].substr(1).toLowerCase()}`;
        
        const pokeList = await CardDatabase.findAll({ where: { name: pokeName } });
        if (pokeList.length == 0) { await response.edit(`${message.author}, that pokemon either dosen't exist or its name is misspelt.`); return; }

        let pokeIndex = 0;

        let wishlistInfo = (await Wishlists.findAll({ where: { card_id: pokeList[pokeIndex].card_id } })).length;

        let attachment = new AttachmentBuilder(await makePokeImage(pokeList[pokeIndex], null), { name: 'poke-image.png' });

        const buttons = makeButton();
        buttons.components[0].setDisabled(true);
        
        await response.edit({ embeds: [makeEmbed(pokeList[pokeIndex], wishlistInfo)], files: [attachment], components: [buttons] });
        
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

        collector.on("collect", async i => {
            if (i.user.id != message.author.id) return;

            if (i.customId == "right") {
                pokeIndex++;
                wishlistInfo = (await Wishlists.findAll({ where: { card_id: pokeList[pokeIndex].card_id } })).length;
                attachment = new AttachmentBuilder(await makePokeImage(pokeList[pokeIndex], null), { name: 'poke-image.png' });

                buttons.components[0].setDisabled(false);
                if (pokeIndex + 1 == pokeList.length) buttons.components[1].setDisabled(true);
                await response.edit({ embeds: [makeEmbed(pokeList[pokeIndex], wishlistInfo)], files: [attachment], components: [buttons] });
                i.deferUpdate();
            }
            else if (i.customId == "left") {
                pokeIndex--;
                wishlistInfo = (await Wishlists.findAll({ where: { card_id: pokeList[pokeIndex].card_id } })).length;
                attachment = new AttachmentBuilder(await makePokeImage(pokeList[pokeIndex], null), { name: 'poke-image.png' });

                buttons.components[1].setDisabled(false);
                if (pokeIndex == 0) buttons.components[0].setDisabled(true);
                await response.edit({ embeds: [makeEmbed(pokeList[pokeIndex], wishlistInfo)], files: [attachment], components: [buttons] });
                i.deferUpdate();
            }
        })
    }
}