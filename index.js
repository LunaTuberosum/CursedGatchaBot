const fs = require('node:fs');
const path = require('node:path');
const {token} = require("./config.json");
const { Client, codeBlock, Collection, Events, GatewayIntentBits } = require('discord.js');
const { Users, CurrencyShop } = require('./dbObjects.js');
const { log } = require('node:console');
const { instatatePassiveCollection, instatateSpecialCollection } = require('./affectionObjects.js');
const { createItemList } = require('./itemObjects.js');

const client = new Client({
    intents:[
        GatewayIntentBits.Guilds, //adds server functionality
        GatewayIntentBits.GuildMessages, //gets messages from our bot.
        GatewayIntentBits.MessageContent, //gets messages contnet from our bot.
        GatewayIntentBits.GuildMessageReactions //gets messages from our bot.
    ]
});

client.commands = new Collection();
client.commandsShort = new Collection();
client.cooldowns = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('name' in command && 'execute' in command) {
			client.commands.set(command.name.toLowerCase(), command);
			if ('shortName' in command) {
				for (const cShort of command.shortName) {
					client.commandsShort.set(cShort.toLowerCase(), command);
				}
			}
			// console.log(client.commandsShort);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "name" or "execute" property.`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// instatatePassiveCollection(client);
// instatateSpecialCollection(client);

createItemList()

client.login(token);