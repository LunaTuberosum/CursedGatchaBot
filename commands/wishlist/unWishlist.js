const { Op } = require('sequelize');
const { CardDatabase, Wishlists } = require('../../dbObjects.js');

function checkIfSpecial(cardName) {
    switch (cardName[0]) {
        case "*":
            return [cardName.split("*")[1], "HOLO"];

        case "[":
            return [cardName.split("[")[1], "FRAME"];

        case "{":
            return [cardName.split("{")[1], "HOLOFRAME"];
    
        default:
            return [cardName, "BASIC"];
    }
}

module.exports = {
    name: "unWishlist",
    shortName: ["uw"],
        
    async execute(message) {
        const splitMessage = message.content.split(" ");

        if (splitMessage.length != 2) {
            message.channel.send(`${message.author}, you must inclued the name of the card you wish to unwishlist.`);
            return;
        }
        else {
            const cardData = checkIfSpecial(splitMessage[1]);
            let card = await CardDatabase.findOne({ where: { name: { [Op.like]: cardData[0] }, card_type: cardData[1] } });

            if (!card) {
                card = await CardDatabase.findOne({ where: { card_id: { [Op.like]: cardData[0] }, card_type: cardData[1] } });

                if (!card) {
                    await message.channel.send(`${message.author}, that card can not be found. The name may be mispelled or it doesn\'t exist.`);
                    return;
                }
            }

            const wish = await Wishlists.findOne({ where: { user_id: message.author.id, card_id: card.card_id, card_type: card.card_type } });

            if (!wish) {
                await message.channel.send(`${message.author}, that card is not on your wishlist.`);
                return;
            }

            await Wishlists.destroy({ where: { user_id: message.author.id, card_id: card.card_id, card_type: card.card_type } });

            await message.channel.send(`${message.author}, the card has been successfully been removed from your wishlist.`);

        }
    }
};