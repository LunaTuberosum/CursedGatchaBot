const { splitContent } = require('../../commandObjects');
const { Tags, Users } = require('../../dbObjects');

module.exports = {
    cooldown: 5,
    name: 'tagRename',
    shortName: ['trn'],
        
    async execute(message) {
        const splitMessage = splitContent(message);

        const user = await Users.findOne({ where: { user_id: message.author.id } });
        if (!user) { await response.edit(`${message.author}, you are not registered. Please register using \`g!register\`.`); return; }

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

        const userCards = await user.getCards();

        for (const card of userCards) {
            if (card.tag == tag.name) {
                card.tag = splitMessage[2];
                card.save();
            }
        }

        tag.name = splitMessage[2];
        tag.save();

        message.channel.send(`${message.author}, tag\'s name has been successfully been changed`);

    },
};