const { AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType} = require("discord.js");
const { CardDatabase, Users, ServerInfo, Wishlists, ItemShop, UserStats, TitleDatabase, UserTitles } = require('../../dbObjects.js');
const { getWhichStar, formatName, makePokeImagePull, checkSeriesCollect, createCardID, checkShinyGrab } = require("../../pullingObjects.js");
const Canvas = require('@napi-rs/canvas');
const UserItems = require("../../models/UserItems.js");

function makeButton() {

    const card1Button = new ButtonBuilder()
        .setCustomId('card1')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('1️⃣');

    const card2Button = new ButtonBuilder()
        .setCustomId('card2')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('2️⃣');

    const row = new ActionRowBuilder()
        .addComponents(card1Button, card2Button);

    return row;
}

function findItem(collection, itemName) {
    for (const item of collection) {
        if (item.item.name == itemName) {
            return item;
        }
    }
    return null;
}

async function addCard(code, user, pokeItem) {
    await user.addCard(code, pokeItem);
}

async function checkGrabTitles(message, userStat) {
    if (userStat.card_grabbed >= 100) {
        const titleData = await TitleDatabase.findOne({ where: { name: "One Man\'s Trash" } });

        if (!titleData) { return; }

        const userTitle = await UserTitles.findOne({ where: { user_id: message.author.id, title_id: titleData.id } });
        
        if (userTitle) { return; }

        await UserTitles.create({ user_id: message.author.id, title_id: titleData.id });

        await message.channel.send(`${message.author}, you have grabbed 100 cards! You have gained the title: \`${titleData.name}\``)
    }
}

async function eventGrabCheck(message, user, i, chance) {
    const random = Math.floor(Math.random() * ((chance + 1) - 1) + 1);

    if (random == chance) {
        const pbItemData = await ItemShop.findOne({ where: { name: "BROKEN PAINTBRUSH" } });

        user.addItem(pbItemData, 1);

        await message.channel.send(`${i.user} also got a \`BROKEN PAINTBRUSH\`!`);
    }
}

async function checkGrabCard(message, response, pokemonData, i) {

    const user = await Users.findOne({ where: { user_id: i.user.id } });
    if (!user) { return; }
    const userStat = await UserStats.findOne({ where: { user_id: user.user_id } });

    const now = Date.now();
    if(user.grab_cooldown < now) {
        user.grab_cooldown = now + 600_000;
        user.save();

        const pokeItem = await CardDatabase.findOne({ where: { card_id: pokemonData["CardID"] || "001", series: pokemonData["Series"], card_type: pokemonData["CardType"] } });
        pokeItem.in_circulation++;
        pokeItem.save();

        userStat.card_grabbed++;
        if (pokemonData["Series"].substring(0, 3) == "SHY") userStat.shiny_grabbed++;
        if (userStat.shiny_grabbed >= 1) checkShinyGrab(message);
        userStat.save();

        await checkGrabTitles(message, userStat);

        cardCode = await createCardID(user);
        addCard(cardCode, user, pokeItem);

        
        checkSeriesCollect(await user.getCards(), pokemonData["Series"], message);

        await message.channel.send({ content: `${i.user} took the **${formatName(pokeItem)}** card \`${cardCode}\`.${pokemonData["Series"].substring(0, 3) == "SHY" ? " It's **SHINY**!!!" : ""}` });

        await eventGrabCheck(message, user, i, 4);
        return true;

    } else {
        const userItems = await user.getItems()
        const extraGrabData = await ItemShop.findOne({ where: { name: `GREAT BALL` } });
        const userItemData = findItem(userItems, extraGrabData.name);

        if (userItemData) {
            userItemData.amount -= 1;
            userItemData.save();

            const pokeItem = await CardDatabase.findOne({ where: { card_id: pokemonData["CardID"] || "001", series: pokemonData["Series"], card_type: pokemonData["CardType"] } });
            pokeItem.in_circulation++;
            pokeItem.save();

            userStat.card_grabbed++;
            if (pokemonData["Series"].substring(0, 3) == "SHY") userStat.shiny_grabbed++;
            if (userStat.shiny_grabbed >= 1) checkShinyGrab(message);
            userStat.save();

            await checkGrabTitles(message, userStat);

            cardCode = await createCardID(user);
            addCard(cardCode, user, pokeItem);

            
            checkSeriesCollect(await user.getCards(), pokemonData["Series"], message);

            await message.channel.send({ content: `${i.user} took the **${formatName(pokeItem)}** card \`${cardCode}\`.${pokemonData["Series"].substring(0, 3) == "SHY" ? " It's **SHINY**!!!" : ""}` });

            await message.channel.send({ content: `You used 1 \`GREAT BALL\` to grab an extra card.`})
            await eventGrabCheck(message, user, i, 6);
            return true;
        }

        await message.channel.send({ content: `${i.user} you must wait \`${Math.round((user.grab_cooldown - now) / 60_000)} minutes\` before grabing a card.`})

        return false;
    }
}

async function pullMechanics(message, response, pokemonData1, pokemonData2) {

    card1Grabed = false;
    card2Grabed = false;

    async function checkGrabs(response, message) {
        if (card1Grabed == true && card2Grabed == true) {
            await response.edit({ components: [], content: `${message.author} pulled these cards.\nThese cards have expired` });
        }
    }
    
    let attachment = new AttachmentBuilder(await makePokeImagePull(pokemonData1, pokemonData2), { name: 'poke-images.png' });

    await response.edit({ content: `${message.author} pulled these cards.`, files: [attachment], components: [makeButton()] });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 40_000 });

    collector.on('collect', async i => {
        i.deferUpdate();
        if (i.customId == 'card1' && card1Grabed == false) {
            card1Grabed = await checkGrabCard(message, response, pokemonData1, i);
            await checkGrabs(response, message);
        }
        else if (i.customId == 'card2' && card2Grabed == false) {
            card2Grabed = await checkGrabCard(message, response, pokemonData2, i);
            await checkGrabs(response, message);
        }
        else {
            await message.channel.send({ content: `${i.user} that card has already been taken.`})
        }
    });
    collector.on('end', async i => {
        await response.edit({ components: [], content: `${message.author} pulled these cards.\nThese cards have expired` });
    });
}

async function checkPullTitles(message, userStat) {
    if (userStat.card_drawn >= 100) {
        const titleData = await TitleDatabase.findOne({ where: { name: "Litterer" } });

        if (!titleData) { return; }

        const userTitle = await UserTitles.findOne({ where: { user_id: message.author.id, title_id: titleData.id } });
        
        if (userTitle) { return; }

        await UserTitles.create({ user_id: message.author.id, title_id: titleData.id });

        await message.channel.send(`${message.author}, you have pulled 100 cards! You have gained the title: \`${titleData.name}\``)
    }
}

module.exports = {
    name: 'pull',
    shortName: ['p'],
        
    async execute(message) {

        let pokemonData1 = {};
        let pokemonData2 = {};

        let user = await Users.findOne({ where: { user_id: message.author.id } });
        if (!user) { await message.channel.send(`${message.author}, you are not registered. Please register using \`g!register\`.`); return; }
        const userStat = await UserStats.findOne({ where: { user_id: user.user_id } });

        let now = Date.now();

        pullChannel = await ServerInfo.findOne({ where: { server_id: message.guild.id, pull_channel: message.channel.id }});
        
        if (pullChannel) {
            if (user.pull_cooldown < now) {

                userStat.card_drawn += 2;
                userStat.save();

                await checkPullTitles(message, userStat);

                user.pull_cooldown = now + (20 * 60_000);
                user.save();

                pokemonData1 = getWhichStar("random");
                const pokeItem1 = await CardDatabase.findOne({ where: { card_id: pokemonData1["CardID"] || "001", series: pokemonData1["Series"], card_type: pokemonData1["CardType"] } });
                pokeItem1.times_pulled++;
                pokeItem1.save();

                pokemonData2 = getWhichStar("random");
                const pokeItem2 = await CardDatabase.findOne({ where: { card_id: pokemonData2["CardID"] || "001", series: pokemonData2["Series"], card_type: pokemonData2["CardType"] } });
                pokeItem2.times_pulled++;
                pokeItem2.save();

                usersWishArray = [];

                usersWishArray.push((await Wishlists.findAll({ where: { card_id: pokemonData1["CardID"], card_type : pokemonData1["CardType"] } })));
                usersWishArray.push((await Wishlists.findAll({ where: { card_id: pokemonData2["CardID"], card_type : pokemonData2["CardType"] } })));

                if (usersWishArray[0].length > 0 || usersWishArray[1].length > 0) {
                    userAtArray = []

                    for (const userCollection of usersWishArray) {
                        for (const userData of userCollection) {
                            if(!userAtArray.find(prevUser => {return prevUser == message.client.users.cache.get((userData.user_id))})) {
                                userAtArray.push(message.client.users.cache.get((userData.user_id)));
                            }
                        }
                    }

                    await message.channel.send(`${userAtArray.join(" ")} a card from your wishlist is dropping.`)
                    const response = await message.channel.send("Loading your pull...");

                    setTimeout(() => {
                        pullMechanics(message, response, pokemonData1, pokemonData2);
                    }, "1000");
                }
                else {
                    const response = await message.channel.send("Loading your pull...");
                    pullMechanics(message, response, pokemonData1, pokemonData2);
                }
            } else {
                await message.channel.send({ content: `${message.author}  You must wait \`${Math.round((user.pull_cooldown - now) / 60000)} minutes\` before you can pull cards again.` })
            }

        }
        else {
            await message.channel.send(`${message.author}, you can't pull in this channel.`);
            return;
        }
    },
};