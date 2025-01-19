const { Users, ItemShop } = require("../../dbObjects");

const claimedUsers = []


module.exports = {
    name: "claim",

    async execute(message) {
        // // For disabling the command
        // return;

        const response = await message.channel.send("loading claim...");

        const user = await Users.findOne({ where: { user_id: message.author.id } });
        if (!user) { await response.edit(`${message.author}, you can not claim the maintenance bonus if you are not registered. Please register with \`g!register\`.`); return; }

        if (claimedUsers.includes(message.author.id)) {
            await response.delete();
            return;
        }

        await response.edit(`${message.author}, thank you for your patience during this latest maintenance ! Here are a free \`50 POKEDOLLARS\`!`);

        const itemData = await ItemShop.findOne({ where: { name: "POKEDOLLAR" } });
        user.addItem(itemData, 70);

        claimedUsers.push(message.author.id);

    }
}