const { Events } = require('discord.js');
const { ServerInfo } = require("../dbObjects.js");
const cron = require('cron');

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};