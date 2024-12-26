const { Users, ItemShop, CardDatabase } = require('../../dbObjects.js');

async function createCardID(user){
    const lastID = user.last_code;

    let newCode = ""
    
    for (num of lastID.slice(2)) {
        let lookNum = num.charCodeAt(0);

        if (lookNum == 57) {
            if (newCode.length > 0) {
                let _ln = newCode[newCode.length - 1].charCodeAt(0);
                _ln++;
            
                if(lastID[newCode.length + 1] == "9"){
                    newCode = newCode.slice(0, newCode.length - 1) + "00";
                } else {
                    newCode = newCode.slice(0, newCode.length - 1) + String.fromCharCode(_ln) + "0";
                }
            }
        }
        else {
            if(newCode.length == 3) {
                lookNum++;
                newCode +=  String.fromCharCode(lookNum);
            }
            else {
                newCode += num;
            }
        }
    }

    newCode = lastID.slice(0, 2) + newCode;
    user.last_code = newCode;
    user.save();
    return newCode;

}

module.exports = {
    name: "giveFullDeck",
    shortName: ["gfd"],
        
    async execute(message) {
        if (message.member.permissionsIn(message.channel).has("ADMINISTRATOR")) {

            const user = await Users.findOne({ where: { user_id: message.author.id } })
            const cardDatabase = await CardDatabase.findAll();
            
            for (const cardData of cardDatabase) {
                cardData.times_pulled++;
                cardData.in_circulation++;
                cardData.save();

                cardCode = await createCardID(user);
                user.addCard(cardCode, cardData);
            }
        }
        else {
            return;
        }

        await message.channel.send({ content: `${message.author} your deck has been filled` })
    }
};