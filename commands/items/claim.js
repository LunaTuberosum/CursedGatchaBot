const { Users, ItemShop, UserStats } = require("../../dbObjects");
const { checkOwnTitle } = require("../../imageObjects");

const claimedUsers = []


module.exports = {
    name: "claim",

    async execute(message) {
        // // For disabling the command
        // return;

        let moneyGiven = 70;

        const response = await message.channel.send("loading claim...");

        const user = await Users.findOne({ where: { user_id: message.author.id } });
        if (!user) { await response.edit(`${message.author}, you can not claim the maintenance bonus if you are not registered. Please register with \`g!register\`.`); return; }

        if (claimedUsers.includes(message.author.id)) {
            await response.delete();
            return;
        }

        await response.edit(`${message.author}, thank you for your patience during this latest maintenance ! Here are a free \`${moneyGiven} POKEDOLLARS\`!`);

        const itemData = await ItemShop.findOne({ where: { name: "POKEDOLLAR" } });
        user.addItem(itemData, moneyGiven);

        const userStat = await UserStats.findOne({ where: { user_id: message.author.id } });
        userStat.money_own += moneyGiven;
        userStat.save()

        checkOwnTitle(userStat, message);


        claimedUsers.push(message.author.id);

    }
}