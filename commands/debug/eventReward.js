const { EmbedBuilder } = require("discord.js");
const { splitContent } = require("../../commandObjects");
const eventRewards = require("../../data/eventRewards.json");
const events = require("../../data/events.json");
const { Users, UserStats, ItemShop } = require("../../dbObjects.js");

function makeEmbed(mention, itemText, eventName) {
    const embed = new EmbedBuilder()
        .setTitle("Event Rewards")
        .setColor("#616161")
        .setDescription(`Congratulations ${mention}! Here are your rewards for completing the \n### ${eventName} event!\n**REWARDS:**\n${itemText}`)

    return embed;
}

module.exports = {
    name: "eventReward",
    shortName: ["er"],

    async execute(message) {
        if (message.member.permissionsIn(message.channel).has("ADMINISTRATOR")) {

            const splitMessage = splitContent(message);

            const user = await Users.findOne({ where: { user_id: message.mentions.users.first().id } });
            
            if (!user) { message.delete(); return; }

            const userStat = await UserStats.findOne({ where: { user_id: user.user_id } });

            const eventReward = eventRewards[splitMessage[2]];

            if (!eventReward) { message.delete(); return; }

            const eventData = events[splitMessage[2]];

            if (!eventData) { message.delete(); return; }
            
            let itemText = "";
            for(const item of eventReward) {
                
                const itemData = await ItemShop.findOne({ where: { name: item["Name"] } });

                user.addItem(itemData, item["Amount"]);
                itemText += `${itemData.emoji} ${item["Amount"]} - \`${itemData.name}\`\n`;
            }

            await message.channel.send({ embeds: [makeEmbed(message.mentions.users.first(), itemText, eventData.name)] });
        }
        
    }
}