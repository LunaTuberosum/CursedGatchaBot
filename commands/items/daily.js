const { EmbedBuilder } = require("discord.js");
const { UserDailys, ItemShop, Users } = require("../../dbObjects")

function makeEmbed(message, dailyText) {

    const embed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Daily`)
        .setDescription(`${message.author}, here are your daily rewards:\n\n${dailyText}\`\`\``)

    return embed;
}

module.exports = {
    name: "daily",

    async execute(message) {
        const user = await Users.findOne({ where: { user_id: message.author.id } });
        if (!user) { await message.channel.send(`${message.author}, you are not registered. Please register using \`g!register\`.`); return; }

        let userDaily = await UserDailys.findOne({ where: { user_id: message.author.id } });

        const date = new Date()

        if (!userDaily) userDaily = await UserDailys.create({ user_id: message.author.id, month: date.getMonth(), day: date.getDate() });
        else {
            if (userDaily.month == date.getMonth() && userDaily.day - 1 == date.getDate()) { await message.channel.send(`${message.author}, you have already claimed your daily.`); return; }
            else { userDaily.month = date.getMonth(); userDaily.day= date.getDate(); userDaily.save(); }
        }
        let dailyText = ``;

        const shinyChance = Math.floor(Math.random() * (101 - 1) + 1); // The maximum is exclusive and the minimum is inclusive
        let shinyMult = 1;
        let shinyMin = 0;
        if (shinyChance <= 5) {
            shinyMult = 2;
            shinyMin = 10;
            dailyText += `You pulled a shiny daily! x2 rewards and increased chances!\n`
        }

        const pokeDollars = (Math.floor(Math.random() * (5 - 2) + 2)) * 10; // The maximum is exclusive and the minimum is inclusive
        const pokeDollarData = await ItemShop.findOne({ where: { id: 1 } });

        const shardID = Math.floor(Math.random() * (12 - 2) + 2); // The maximum is exclusive and the minimum is inclusive
        const shardData = await ItemShop.findOne({ where: { id: shardID } });
        const shardAmount = Math.floor(Math.random() * (3 - 1) + 1); // The maximum is exclusive and the minimum is inclusive

        dailyText += `\`\`\`- ${pokeDollars * shinyMult} POKEDOLLARS\n- ${shardAmount * shinyMult} ${shardData.name}`;

        const gemChance = Math.max((Math.floor(Math.random() * (101 - 1) + 1)) - shinyMin, 1); // The maximum is exclusive and the minimum is inclusive
        let gemID = null;
        let gemData = null
        if (gemChance <= 20) {
            gemID = Math.floor(Math.random() * (22 - 12) + 12); // The maximum is exclusive and the minimum is inclusive
            gemData = await ItemShop.findOne({ where: { id: gemID } });
            dailyText += `\n- ${1 * shinyMult} ${gemData.name}`;
        }

        const grabChance = Math.max((Math.floor(Math.random() * (101 - 1) + 1)) - shinyMin, 1); // The maximum is exclusive and the minimum is inclusive
        let grabData;
        if (grabChance == 1) {
            grabData = await ItemShop.findOne({ where: { id: 24 } });
            dailyText += `\n- ${1 * shinyMult} ${grabData.name}`;
        }

        await message.channel.send({ embeds: [makeEmbed(message, dailyText)] });

        user.addItem(pokeDollarData, pokeDollars * shinyMult);
        user.addItem(shardData, shardAmount * shinyMult);
        if (gemData) user.addItem(gemData, 1 * shinyMult);
        if (grabData) user.addItem(grabData, 1 * shinyMult);
    }
}