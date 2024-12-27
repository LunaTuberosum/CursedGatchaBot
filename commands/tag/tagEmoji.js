const emojiRegex = require('emoji-regex');
const { Tags } = require('../../dbObjects');

module.exports = {
    cooldown: 5,
    name: 'tagEmoji',
    shortName: ['te'],
        
    async execute(message) {
        const splitMessage = message.content.split(" ");

        if (splitMessage.length != 3) {
            message.channel.send(`${message.author}, you must specify both the original name and the new emoji.`);
            return;
        }
        else if (splitMessage.length > 3) {
            message.channel.send(`${message.author}, you must only specify both the original name and the new emoji.`);
            return;
        }

        const regex = emojiRegex();
        let emoji;

        for (const match of splitMessage[2].matchAll(regex)){
            emoji = match[0];
            break;
        }

        if (!emoji) {
            message.channel.send(`${message.author}, you must specify a emoji at the end when changing the emoji on a tag.`);
            return;
        }

        const existingTag = await Tags.findOne({ where: { user_id: message.author.id, emoji: emoji } });

        if (existingTag) {
            message.channel.send(`${message.author}, a tag already has that emoji.`);
            return;
        }

        const tag = await Tags.findOne({ where: { user_id: message.author.id, name: splitMessage[1] } });

        tag.emoji = emoji;
        tag.save();

        message.channel.send(`${message.author}, tag\'s emoji has been successfully been changed`);

    },
};