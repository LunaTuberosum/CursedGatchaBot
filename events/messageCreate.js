const { Events, Collection } = require('discord.js');

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {

        if (message.content != "" && message.content[0].toLowerCase() == "c"){

            messageCommand = message.content.split(" ")[0];

            let command = message.client.commands.get(messageCommand.toLowerCase().slice(1))
            if (messageCommand.slice(0, 2) == "c!") { command = message.client.commands.get(messageCommand.toLowerCase().slice(2)) }

            if (!command) {
                command = message.client.commandsShort.get(messageCommand.toLowerCase().slice(1))
                if (messageCommand.slice(0, 2) == "c!") { command = message.client.commandsShort.get(messageCommand.toLowerCase().slice(2)) }

                if (!command) {
                    console.error(`No command matching ${message.content} was found.`);

                    return;
                }
                
            }

            const { cooldowns } = message.client;

            if (!cooldowns.has(command.name)) {
                cooldowns.set(command.name, new Collection());
            }

            const now = Date.now();
            const timestamps = cooldowns.get(command.name);
            const defaultCooldownDuration = 1;
            const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

            if (timestamps.has(message.author.id)) {
            	const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

            	if (now < expirationTime) {
            		const expiredTimestamp = Math.round(expirationTime / 1000);
            		return message.reply({ content: `Please wait, you are on a cooldown for \`${command.name}\`. You can use it again <t:${expiredTimestamp}:R>.`, ephemeral: true });
            	}

            }

            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

            try {
            	await command.execute(message);
            } catch (error) {
            	console.error(`Error executing ${message.commandName}`);
            	console.error(error);
            }
        }
	},
};