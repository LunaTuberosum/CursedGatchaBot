const { splitContent } = require('../../commandObjects');
const { Tags } = require('../../dbObjects');

module.exports = {
    cooldown: 5,
    name: 'tagDelete',
    shortName: ['td'],
        
    async execute(message) {
        const splitMessage = splitContent(message);

        if (splitMessage.length != 2 || splitMessage.length > 2) {
            message.channel.send(`${message.author}, you must specify the name of the tag.`);
            return;
        }

        try {
            Tags.destroy({ where: { name: splitMessage[1] } });
            
        } catch (error) {
            await message.channel.send(`${message.author}, please send a vaild tag name`); 
            return; 
            
        }

        message.channel.send(`${message.author}, tag has been successfully deleted.`);

    },
};