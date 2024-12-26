const { AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType} = require("discord.js");
const { CardDatabase, Users, ServerInfo, Wishlists, ItemShop } = require('../../dbObjects.js');
const { getWhichStar, addBalance, rarityStars } = require("../../pullingObjects.js");
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

async function addCard(code, user, pokemonData) {
    const pokeItem = await CardDatabase.findOne({ where: {card_id: pokemonData["CardID"] || "001" } });

    await user.addCard(code, pokeItem);
}

async function checkGrabs(response, message) {
    if (card1Grabed == true && card2Grabed == true) {
        await response.edit({ components: [], content: `${message.author} pulled these cards.\nThese cards have expired` });
    }
}

async function createCardID(user){
    const lastID = user.last_code;

    let newCode = ""
    
    for (num of lastID.slice(2)) {
        let lookNum = num.charCodeAt(0);

        if (lookNum == 57) {
            if (newCode.length > 0) {
                let _ln = newCode[newCode.length - 1].charCodeAt(0);
                _ln++;
            
                if(lastID[newCode.length + 1] == "9"){
                    newCode = newCode.slice(0, newCode.length - 1) + "00";
                } else {
                    newCode = newCode.slice(0, newCode.length - 1) + String.fromCharCode(_ln) + "0";
                }
            }
        }
        else {
            if(newCode.length == 3) {
                lookNum++;
                newCode +=  String.fromCharCode(lookNum);
            }
            else {
                newCode += num;
            }
        }
    }

    newCode = lastID.slice(0, 2) + newCode;
    user.last_code = newCode;
    user.save();
    return newCode;

}

async function checkGrabCard(message, response, pokemonData, i) {
    const user = await Users.findOne({ where: { user_id: i.user.id } });
    const now = Date.now();
    if(user.grab_cooldown < now) {
        user.grab_cooldown = now + 600_000;
        user.save();

        const pokeItem = await CardDatabase.findOne({ where: { card_id: pokemonData["CardID"] || "001" } });
        pokeItem.times_pulled++;
        pokeItem.in_circulation++;
        pokeItem.save();

        cardCode = await createCardID(user);
        addCard(cardCode, user, pokemonData);

        await message.channel.send({ content: `${i.user} took the **${pokemonData["Name"]}** card \`${cardCode}\`.` });
        await i.deferUpdate();
        await checkGrabs(response, message);

        return true;

    } else {
        const userItems = await user.getItems()
        const extraGrabData = await ItemShop.findOne({ where: { name: `EXTRA GRAB` } });
        const userItemData = findItem(userItems, extraGrabData.name);

        if (userItemData) {
            userItemData.amount -= 1;
            userItemData.save();

            user.grab_cooldown = 0;
            user.save();

            await message.channel.send({ content: `You used 1 Extra grab to grab an extra card.`})
            return await checkGrabCard(message, response, pokemonData, i);
        }

        await message.channel.send({ content: `${i.user} you must wait \`${Math.round((user.grab_cooldown - now) / 60_000)} minutes\` before grabing a card.`})
        await i.deferUpdate();

        return false;
    }
}

async function pullMechanics(message, pokemonData1, pokemonData2) {
    
    const canvas = Canvas.createCanvas(2520, 1490);
    const context = canvas.getContext('2d');

    const img1 = await Canvas.loadImage(`./pokeImages/${pokemonData1["CardID"]}-${pokemonData1["Name"]}.png`);
    const img2 = await Canvas.loadImage(`./pokeImages/${pokemonData2["CardID"]}-${pokemonData2["Name"]}.png`);
    const frame = await Canvas.loadImage(`./pokeImages/frames/Normal-Frame.png`);

    context.drawImage(img1, 0, 100, img2.width, img1.height);
    context.drawImage(frame, 0, 100, img2.width, img1.height);
    context.drawImage(img2, 900, 100, img2.width, img2.height);
    context.drawImage(frame, 900, 100, img2.width, img2.height);

    let attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'poke-images.png' });

    const response = await message.channel.send({ content: `${message.author} pulled these cards.`, files: [attachment], components: [makeButton()] });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15_000 });

    card1Grabed = false;
    card2Grabed = false;

    collector.on('collect', async i => {
        if (i.customId == 'card1' && card1Grabed == false) {
            card1Grabed = await checkGrabCard(message, response, pokemonData1, i);
        }
        else if (i.customId == 'card2' && card2Grabed == false) {
            card2Grabed = await checkGrabCard(message, response, pokemonData2, i);
        }
        else {
            await message.channel.send({ content: `${i.user} that card has already been taken.`})
            await i.deferUpdate();
        }
    });
    collector.on('end', async i => {
        await response.edit({ components: [], content: `${message.author} pulled these cards.\nThese cards have expired` });
    });
}

module.exports = {
    name: 'pull',
    shortName: ['p'],
        
    async execute(message) {

        let pokemonData1 = {};
        let pokemonData2 = {};
        let user = await Users.findOne({ where: { user_id: message.author.id } });
        let now = Date.now();

        pullChannel = await ServerInfo.findOne({ where: { server_id: message.guild.id, pull_channel: message.channel.id }});
        
        if (pullChannel) {
            if (user.pull_cooldown < now) {

                user.pull_cooldown = now + (20 * 60_000);
                user.save();

                pokemonData1 = getWhichStar();
                pokemonData2 = getWhichStar();

                usersWishArray = [];

                usersWishArray.push((await Wishlists.findAll({ where: { card_id: pokemonData1["CardID"] } })));
                usersWishArray.push((await Wishlists.findAll({ where: { card_id: pokemonData2["CardID"] } })));

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

                    setTimeout(() => {
                        pullMechanics(message, pokemonData1, pokemonData2);
                    }, "1000");
                }
                else {
                    pullMechanics(message, pokemonData1, pokemonData2);
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