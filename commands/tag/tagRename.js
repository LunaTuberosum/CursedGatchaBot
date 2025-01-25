const { splitContent } = require('../../commandObjects');
const { Tags } = require('../../dbObjects');

module.exports = {
    cooldown: 5,
    name: 'tagRename',
    shortName: ['trn'],
        
    async execute(message) {
        const splitMessage = splitContent(message);

        if (splitMessage.length != 3) {
            message.channel.send(`${message.author}, you must specify both the orinal name and the new name.`);
            return;
        }
        else if (splitMessage.length > 3) {
            message.channel.send(`${message.author}, you must only specify both the orinal name and the new name.`);
            return;
        }

        const existingTag = await Tags.findOne({ where: { user_id: message.author.id, name: splitMessage[2] } });

        if (existingTag) {
            message.channel.send(`${message.author}, a tag already has that name.`);
            return;
        }

        const tag = await Tags.findOne({ where: { user_id: message.author.id, name: splitMessage[1] } });

        if (!tag) { await message.channel.send(`${message.author}, please send a vaild tag name`); return; }

        tag.name = splitMessage[2];
        tag.save();

        message.channel.send(`${message.author}, tag\'s name has been successfully been changed`);

    },
};