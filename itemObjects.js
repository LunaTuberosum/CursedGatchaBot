const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { ServerInfo, Users } = require('./dbObjects.js');
const raidJoin = require('./raid/raidJoin.js')


let itemList = new Map();

function createItemList() {
    itemList.set("DRAW 3", useDraw3);
    itemList.set("DRAW 5", useDraw5);
    itemList.set("EXTRA GRAB", useExtraGrab);
    itemList.set("RAIDING PASS", useRaidingPass);
    itemList.set("RAID LURE", useRaidLure);
}

function findItem(collection, itemName) {
    for (const item of collection) {
        if (item.item.name == itemName) {
            return item;
        }
    }
    return null;
}

function makeButton() {

    const cancelButton = new ButtonBuilder()
        .setCustomId("cancel")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("✖");

    const confirmButton = new ButtonBuilder()
        .setCustomId("confirm")
        .setStyle(ButtonStyle.Success)
        .setEmoji("✔")

    const row = new ActionRowBuilder()
        .addComponents(cancelButton, confirmButton);

    return row;
}

async function useDraw3(message) {
    await message.channel.send({ content: `${message.author}, not yet implemted.` })
    return 0;
}

async function useDraw5(message) {
    await message.channel.send({ content: `${message.author}, not yet implemted.` })
    return 0;
}

async function useExtraGrab(message) {
    await message.channel.send({ content: `${message.author}, the EXTRA GRAB item is used when you attept to grab a card while your on cooldown. You can not use it on its own.` })
    return 0;
}

async function useRaidingPass(message) {
    await message.channel.send({ content: `${message.author}, the RAIDING PASS item is used when you click to join a raid. You can not use it on its own.` })
    return 0;
}


function makeRaidLureEmbed(message) {

    const raidLureEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Use Raid Lure`)
        .setDescription(`${message.author}, do you want to use a RAID LURE? \n\`\`\`Note: \n- A RAID LURE will spawn a random difficulty RAID. \n- You are not required to join a RAID you start. \n- No bonuses will be given to you for starting a RAID.\`\`\``)

    return raidLureEmbed;
}

function makeRaidLureCanceledEmbed(message) {

    const raidLureEmbed = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setTitle(`Use Raid Lure`)
        .setDescription(`${message.author}, canceled. \n\`\`\`Canceled use of RAID LURE.\`\`\``)

    return raidLureEmbed;
}

function makeRaidLureConfirmEmbed(message) {

    const raidLureEmbed = new EmbedBuilder()
        .setColor("#26bd0f")
        .setTitle(`Use Raid Lure`)
        .setDescription(`${message.author}, get ready. \n\`\`\`RAID LURE used. RAID will beign soon.\`\`\``)

    return raidLureEmbed;
}

async function useRaidLure(message) {
    return;
    const server = await ServerInfo.findOne({ where: { server_id: message.guild.id, raid_channel: message.channel.id } });
    
    if (!server) {
        await message.channel.send(`${message.author}, you can't start raids in this channel.`);
        return;
    }

    const response = await message.channel.send({ content: "", embeds: [makeRaidLureEmbed(message)], components: [makeButton()] });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150_000 });

    collector.on("collect", async i => {
        if (i.user == message.author) {
            if (i.customId == "cancel") {
                await response.edit({ embeds: [makeRaidLureCanceledEmbed(message)], components: [] });
                return;
            }
            else if (i.customId == "confirm") {
                const user = await Users.findOne({ where : { user_id: message.author.id } });
                const userItems = await user.getItems();
                const userItemData = findItem(userItems, "RAID LURE");
                userItemData.amount -= 1;
                userItemData.save()

                await response.edit({ embeds: [makeRaidLureConfirmEmbed(message)], components: [] });
                await raidJoin.execute(message);
                return;
            };
        };
    });

}


async function getItemUse(itemName, message) {
    try {
        await itemList.get(itemName)(message);
        return
    }
    catch {
        await message.channel.send({ content: `${message.author}, that item does not have a use.` });
        return;
    };
}

module.exports = ({ getItemUse, createItemList })