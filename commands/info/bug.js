const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "bug",
    shortName: ["bugs", "bugreport"],

    async execute(message) {
        
        await message.channel.send("You can file any bugs you encounter here: [BUG REPORT FORM](https://docs.google.com/forms/d/e/1FAIpQLSf8-5x2GvZWmZ3QmvVmbm4rMUZvdHH6mqyVUpa-mTQUA4A8bQ/viewform?usp=sharing)");
    }
}