const { Tags, Users, UserCards } = require('../../dbObjects');

module.exports = {
    cooldown: 5,
    name: 'tag',
        
    async execute(message) {
        const splitMessage = message.content.split(" ");

        if (splitMessage.length < 3) {
            message.channel.send(`${message.author}, you must specify both the name of tag and the card codes.`);
            return;
        }

        const tag = await Tags.findOne({ where: { name: splitMessage[1] } });

        if(!tag) {
            message.channel.send(`${message.author}, that tag dosen\'t exist`);
            return;
        }


        let i =0;
        for (const code of splitMessage) {
            if(i >= 2) {
                const card = await UserCards.findOne({ where: { user_id: message.author.id, item_id: code } })

                if (!card) {
                    message.channel.send(`${message.author}, you are not the owner of at least one of those cards.`);
                    return;
                }

                card.tag = splitMessage[1];
                card.save();

            }
            i++;
        }

        message.channel.send(`${message.author}, cards have been successfully tagged.`);


    },
};