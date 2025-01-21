const emojiRegex = require('emoji-regex');
const { Tags } = require('../../dbObjects');
const { splitContent } = require('../../commandObjects');

module.exports = {
    cooldown: 5,
    name: 'tagCreate',
    shortName: ['tc'],
        
    async execute(message) {
        const splitMessage = splitContent(message);

        if (splitMessage.length != 3) {
            message.channel.send(`${message.author}, you must specify both a name (without spaces) and emoji when adding a new tag.`);
            return;
        }
        else if (splitMessage.length > 3) {
            message.channel.send(`${message.author}, you must only specify both a name (without spaces) and emoji when adding a new tag.`);
            return;
        }

        const regex = emojiRegex();
        let emoji;

        for (const match of splitMessage[2].matchAll(regex)){
            emoji = match[0];
            break;
        }

        if (!emoji) {
            message.channel.send(`${message.author}, you must specify a emoji at the end when adding a new tag.`);
            return;
        }

        const existingTag = await Tags.findOne({ where: { user_id: message.author.id, name: splitMessage[1] } });

        if (existingTag) {
            message.channel.send(`${message.author}, that tag already exists`);
            return;
        }
        
        await Tags.create({ user_id: message.author.id, name: splitMessage[1], emoji: emoji });

        message.channel.send(`${message.author}, tag has been successfully made`);

    },
};