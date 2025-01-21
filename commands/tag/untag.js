const { splitContent } = require('../../commandObjects');
const { Tags, Users, UserCards } = require('../../dbObjects');

module.exports = {
    cooldown: 5,
    name: 'untag',
    shortName: ['ut'],
        
    async execute(message) {
        const splitMessage = splitContent(message);

        if (splitMessage.length < 2) {
            message.channel.send(`${message.author}, you must specify the card codes.`);
            return;
        }
        else {

            let i =0;
            for (const code of splitMessage) {
                if(i >= 1) {
                    const card = await UserCards.findOne({ where: { user_id: message.author.id, item_id: code } })

                    if (!card) {
                        message.channel.send(`${message.author}, you are not the owner of at least one of those cards.`);
                        return;
                    }

                    card.tag = "None";
                    card.save();

                }
                i++;
            }

            message.channel.send(`${message.author}, cards have been successfully untagged.`);

        }

    },
};