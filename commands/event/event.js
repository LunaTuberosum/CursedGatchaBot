const { EmbedBuilder } = require("discord.js");
const events = require("../../data/events.json");

function makeEmbed(currentEvents) {
    const embed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle("Events")
        .setDescription(currentEvents.join("\n"))

    return embed;
}

module.exports = {
    name: "event",
    smallName: ["e"],

    async execute(message) {
        const currentEvents = [];

        for (const eventID of Object.keys(events)) {
            const event = events[eventID];

            if (event.active) {
                currentEvents.push(`### ${event.name}${event.time != "na" ? `\n${event.time}` : ""}\n\`\`\`${event.description}\n\nREWARDS: ${event.rewards}\`\`\``)
            }
            
        }

        await message.channel.send({ embeds: [makeEmbed(currentEvents)] });
    }
}