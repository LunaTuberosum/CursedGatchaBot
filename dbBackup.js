var fs = require('fs');
const { Tags, Users, UserCards, UserStats, UserTitles, TitleDatabase, UserDailys, CardDatabase, UserItems, UserEventItems, ItemShop, EventShop, ServerInfo, Wishlists } = require('./dbObjects');
    
async function backup() {
    // CREATE DICT BACK UP
    let databaseDict = {
        "users" : await Users.findAll({ where: { }, raw: true }),
        "userStats" : await UserStats.findAll({ where: { }, raw: true }),
        "userTitles" : await UserTitles.findAll({ where: { }, raw: true }),
        "titleDatabase" : await TitleDatabase.findAll({ where: { }, raw: true }),
        "userCards" : await UserCards.findAll({ where: { }, raw: true }),
        "userDailys" : await UserDailys.findAll({ where: { }, raw: true }),
        "cardDatabase" : await CardDatabase.findAll({ where: { }, raw: true }),
        "userItems" : await UserItems.findAll({ where: { }, raw: true }),
        "userEventItems" : await UserEventItems.findAll({ where: { }, raw: true }),
        "itemShop" : await ItemShop.findAll({ where: { }, raw: true }),
        "eventShop" : await EventShop.findAll({ where: { }, raw: true }),
        "serverInfo" : await ServerInfo.findAll({ where: { }, raw: true }),
        "wishlists" : await Wishlists.findAll({ where: { }, raw: true }),
        "tags" : await Tags.findAll({ where: { }, raw: true })
    }
    
    // WRITE DATA BASE BACK UP
    const dictString = JSON.stringify(databaseDict, null, "\t");
    fs.writeFile("databaseBackup.json", dictString, function(err, result) {
        if(err) console.log('error', err);
    });
}

backup();