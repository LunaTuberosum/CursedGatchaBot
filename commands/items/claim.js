const claimedUsers = []

module.exports = {
    name: "claim",

    async execute(message) {
        const response = await message.channel.send("loading claim...");

        if (claimedUsers.includes(message.author.id)) {
            await message.channel.send(`- ${claimedUsers.join("")}`);
            return;
        }

        claimedUsers.push(message.author.id);
        await message.channel.send(`-- ${claimedUsers.join(" ")}`);

    }
}