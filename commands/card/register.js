const { EmbedBuilder, AttachmentBuilder  } = require("discord.js");
const { CardDatabase, Users, ItemShop, UserCards, UserStats } = require('../../dbObjects.js');
const { getWhichStar, raritySymbol, makePokeImage } = require("../../pullingObjects.js");
const Canvas = require('@napi-rs/canvas');

var pokemonData = {};

function makeImageEmbed(newCardCode) {
    const imageEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Card ID: \`${newCardCode}\` - \`${raritySymbol(pokemonData["Rarity"])}\``)
        .setImage(`attachment://${pokemonData["CardID"]}-${pokemonData["Name"]}.png`)
        .setDescription(`${pokemonData["Series"].substring(0, 3) == "SHY" ? "It's **SHINY**!!!" : ""}`)
        .setFooter({ text: `${pokemonData["Series"]}`});

    return imageEmbed;
}

function makeEmbed() {

    const infoEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Welcome to Cursed PokeGatcha`)
        .setDescription(`* Enjoy pulling for \"blessed\" pokemon drawn by \`MediBotEve\`\n* As a way to start here is a free card and \`100 POKEDOLLARS\`\n* Start playing by typing **g!pull** for a free pull every \`20 minutes\`\n* If you need help type **g!help**\n* Support Eve at **\`Twitch.tv/MediBotEve\`**`)
        .setFooter({ text: "Bot Made by: Luna Tuberosum"})

    return infoEmbed;
}

module.exports = {
    name: "register",
    shortName: ["reg"],
        
    async execute(message) {

        pokemonData = getWhichStar("random");

        const card = await CardDatabase.findOne({ where: { card_id: pokemonData["CardID"] } });

        const target = message.author;

        let user = await Users.findOne({ where: { user_id: target.id } });

        if (user) {
            await message.channel.send(`${message.author} have already registered.`);
            return;
        }
        
        const lastUser = await Users.findOne({
            order: [['createdAt', 'DESC']]
        })

        let newUserCode = "aa";

        if(lastUser) {
            const lastUserCodeNum1 = lastUser.user_code.charCodeAt(0);
            const lastUserCodeNum2 = lastUser.user_code.charCodeAt(1);

            if (lastUserCodeNum2 == 122) {
                newUserCode = `${String.fromCharCode(lastUserCodeNum1 + 1)}a`;
            }
            else {
                newUserCode = `${String.fromCharCode(lastUserCodeNum1)}${String.fromCharCode(lastUserCodeNum2 + 1)}`;
            }
        }

        const newUser = await Users.create({ user_id: target.id, user_code: newUserCode, balance: 100 });

        const date = new Date();
        const regDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
        const newUserData = await UserStats.create({ user_id: newUser.user_id, register_date: regDate });

        user = await Users.findOne({ where: { user_id: target.id } });
 
        const userCode = await user.user_code

        const cardData = await user.addCard(userCode + "0000", card);
        
        user.last_code = userCode + "0000";
        user.save();

        if (pokemonData["Series"].substring(0, 3) == "SHY") newUserData.shiny_grabbed++;
        newUserData.save();

        card.times_pulled++;
        card.in_circulation++;
        card.save();
        user.addItem(await ItemShop.findOne({ where: { name: "POKEDOLLAR" } }), 100);

        attachment = new AttachmentBuilder(await makePokeImage(card, cardData), { name: 'poke-image.png' });

        const imageEmbed = makeImageEmbed(userCode + "0000");
        const infoEmbed = makeEmbed();
        await message.channel.send({embeds: [infoEmbed, imageEmbed], files: [attachment]});
    },
};