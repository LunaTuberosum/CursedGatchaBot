const Sequelize = require('sequelize');
var fs = require('fs');

allCards = require("./packs/allCards.json");

const sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'database.sqlite',
});

const Users = require('./models/Users.js')(sequelize, Sequelize.DataTypes);
const UserStats = require('./models/UserStats.js')(sequelize, Sequelize.DataTypes);
const UserTitles = require('./models/UserTitles.js')(sequelize, Sequelize.DataTypes);
const TitleDatabase = require('./models/TitleDatabase.js')(sequelize, Sequelize.DataTypes);
const UserCards = require('./models/UserCards.js')(sequelize, Sequelize.DataTypes);
const UserDailys = require('./models/UserDailys.js')(sequelize, Sequelize.DataTypes);
const CardDatabase = require('./models/CardDatabase.js')(sequelize, Sequelize.DataTypes);
const UserItems = require('./models/UserItems.js')(sequelize, Sequelize.DataTypes);
const UserEventItems = require('./models/UserEventItems.js')(sequelize, Sequelize.DataTypes);
const ItemShop = require('./models/ItemShop.js')(sequelize, Sequelize.DataTypes);
const EventShop = require('./models/EventShop.js')(sequelize, Sequelize.DataTypes);
const ServerInfo = require('./models/ServerInfo.js')(sequelize, Sequelize.DataTypes);
const Wishlists = require('./models/Wishlists.js')(sequelize, Sequelize.DataTypes);
const Tags = require('./models/Tags.js')(sequelize, Sequelize.DataTypes);

async function changeData(databaseDict) {

    for (item in databaseDict["itemShop"]) {
        if (databaseDict["itemShop"][item]["name"] == "BIG PACK"){
            databaseDict["itemShop"][item]["cost"] = 300;
        }
        if (databaseDict["itemShop"][item]["name"] == "SMALL PACK"){
            databaseDict["itemShop"][item]["cost"] = 210;
        }
    }
    return databaseDict
}

async function print() {

    let databaseDict = JSON.parse(fs.readFileSync("databaseBackup.json"));
    
    databaseDict = await changeData(databaseDict);

    const force = true;

    // RECREATE DATA BASE WITH NEW DATA
    sequelize.sync({ force }).then(async () => {

        // RECRATE USER
        const users = [];

        for (const userIndex in databaseDict["users"]) {
            const user = databaseDict["users"][userIndex];

            users.push(Users.upsert({
                user_id: user["user_id"],
                user_code: user["user_code"],
                last_code: user["last_code"],
                pull_cooldown: user["pull_cooldown"],
                grab_cooldown: user["grab_cooldown"],
                wishlist_channel: user["wishlist_channel"],
                createdAt: user["createdAt"],
                updatedAt: user["updatedAt"]
            }));
        }
    
        // RECREATE USER STATS
        const userStats = [];

        for (const userStatIndex in databaseDict["userStats"]) {
            const userStat = databaseDict["userStats"][userStatIndex];

            userStats.push(UserStats.upsert({
                user_id: userStat["user_id"],
                register_date: userStat["register_date"],
                card_released: userStat["card_released"],
                card_drawn: userStat["card_drawn"],
                card_grabbed: userStat["card_grabbed"],
                shiny_grabed: userStat["shiny_grabed"],
                money_spent: userStat["money_spent"],
                money_own: userStat["money_own"],
                createdAt: userStat["createdAt"],
                updatedAt: userStat["updatedAt"]
            }));
        }

        // RECREATE USER TITLES
        const userTitles = [];

        for (const userTitleIndex in databaseDict["userTitles"]) {
            const userTitle = databaseDict["userTitles"][userTitleIndex];

            userTitles.push(UserTitles.upsert({
                id: userTitle["id"],
                user_id: userTitle["user_id"],
                title_id: userTitle["title_id"],
                createdAt: userTitle["createdAt"],
                updatedAt: userTitle["updatedAt"]
            }));
        }

        // RECREATE TITLES
        const titleDatabase = [];

        for (const titleIndex in databaseDict["titleDatabase"]) {
            const title = databaseDict["titleDatabase"][titleIndex];

            titleDatabase.push(TitleDatabase.upsert({
                id: title["id"],
                name: title["name"],
                description: title["description"]
            }));
        }

        titleDatabase.push(TitleDatabase.upsert({
            id: 14,
            name: "Kid’s First Art",
            description: "Collect 1 card from the CRAP series."
        }));

        titleDatabase.push(TitleDatabase.upsert({
            id: 15,
            name: "A Full Fridge",
            description: "Collect all cards from the CRAP series. (Chase card not included)"
        }));

        titleDatabase.push(TitleDatabase.upsert({
            id: 16,
            name: "A Cluttered Fridge",
            description: "Collect all cards from the CRAP series each card variant. (Chase card not included)"
        }));

        titleDatabase.push(TitleDatabase.upsert({
            id: 17,
            name: "A Hidden Card",
            description: "Collect the hidden card from the CRAP series."
        }));

        // RECREATE USER CARDS
        const userCards = [];

        for (const userCardIndex in databaseDict["userCards"]) {
            const userCard = databaseDict["userCards"][userCardIndex];

            userCards.push(UserCards.upsert({
                id: userCard["id"],
                user_id: userCard["user_id"],
                item_id: userCard["item_id"],
                item_info: userCard["item_info"],
                level: userCard["level"],
                attack: userCard["attack"],
                defence: userCard["defence"],
                speed: userCard["speed"],
                tag: userCard["tag"],
                createdAt: userCard["createdAt"],
                updatedAt: userCard["updatedAt"]
            }));
        }

        // RECREATE USER DAILY
        const userDailys = [];

        for (const userDailyIndex in databaseDict["userDailys"]) {
            const userDaily = databaseDict["userDailys"][userDailyIndex];

            userDailys.push(UserDailys.upsert({
                user_id: userDaily["user_id"],
                month: userDaily["month"],
                day: userDaily["day"],
                amount: userDaily["amount"]
            }));
        }

        // RECREATE CARD DATABASE
        const cardDatabase = [];

        for (const cardIndex in databaseDict["cardDatabase"]) {
            const card = databaseDict["cardDatabase"][cardIndex];

            cardDatabase.push(CardDatabase.upsert({
                id: card["id"],
                name: card["name"],
                type: card["type"],
                card_id: card["card_id"],
                drawn_date: card["drawn_date"],
                poke_number: card["poke_number"],
                rarity: card["rarity"],
                card_type: card["card_type"],
                poke_type: card["poke_type"],
                series: card["series"],
                obtain: card["obtain"],
                times_pulled: card["times_pulled"],
                in_circulation: card["in_circulation"]
            }));
        }   
        
        // TEMP ADD NEW CARDS
        for (const series in allCards) {
            if (series != "CRAP") continue;

            for (const card in allCards[series])
                cardDatabase.push(CardDatabase.upsert({ 
                    name: allCards[series][card]["Name"],
                    type: allCards[series][card]["Type"],
                    card_id: allCards[series][card]["CardID"],
                    drawn_date: allCards[series][card]["DrawDate"],
                    poke_number: allCards[series][card]["Poke#"],
                    rarity: allCards[series][card]["Rarity"],
                    card_type: allCards[series][card]["CardType"],
                    poke_type: allCards[series][card]["PokeType"],
                    series: allCards[series][card]["Series"],
                    obtain: allCards[series][card]["Obtain"]
                }));
        }

        // RECREATE USER ITEMS
        const userItems = [];

        for (const userItemIndex in databaseDict["userItems"]) {
            const userItem = databaseDict["userItems"][userItemIndex];

            userItems.push(UserItems.upsert({
                id: userItem["id"],
                user_id: userItem["user_id"],
                item_id: userItem["item_id"],
                amount: userItem["amount"],
                createdAt: userItem["createdAt"],
                updatedAt: userItem["updatedAt"]
            }));
        }

        // RECREATE USER EVENT ITEMS
        const userEventItems = [];

        for (const userItemIndex in databaseDict["userEventItems"]) {
            const userItem = databaseDict["userEventItems"][userItemIndex];

            userEventItems.push(UserEventItems.upsert({
                id: userItem["id"],
                user_id: userItem["user_id"],
                item_id: userItem["item_id"],
                amount: userItem["amount"],
                createdAt: userItem["createdAt"],
                updatedAt: userItem["updatedAt"]
            }));
        }

        // RECREATE ITEM SHOP
        const itemShop = [];

        for (const itemIndex in databaseDict["itemShop"]) {
            const item = databaseDict["itemShop"][itemIndex];

            itemShop.push(ItemShop.upsert({
                id: item["id"],
                name: item["name"],
                emoji: item["emoji"],
                itemCost: item["itemCost"],
                cost: item["cost"],
                description: item["description"]
            }));
        }

        // RECREATE EVENT SHOP
        const eventShop = [];

        for (const itemIndex in databaseDict["eventShop"]) {
            const item = databaseDict["eventShop"][itemIndex];

            eventShop.push(EventShop.upsert({
                id: item["id"],
                name: item["name"],
                emoji: item["emoji"],
                event: item["event"],
                itemCost: item["itemCost"],
                cost: item["cost"],
                description: item["description"]
            }));
        }

        // RECREATE SERVER INFO
        const serverInfo = [];

        for (const serverIndex in databaseDict["serverInfo"]) {
            const server = databaseDict["serverInfo"][serverIndex];

            serverInfo.push(ServerInfo.upsert({
                id: server["id"],
                server_id: server["server_id"],
                pull_channel: server["pull_channel"],
                raid_channel: server["raid_channel"]
            }));
        }

        // RECREATE WISHLIST
        const wishlists = [];

        for (const wishlistIndex in databaseDict["wishlists"]) {
            const wishlist = databaseDict["wishlists"][wishlistIndex];

            wishlists.push(Wishlists.upsert({
                id: wishlist["id"],
                user_id: wishlist["user_id"],
                card_id: wishlist["card_id"],
                card_type: wishlist["card_type"],
                createdAt: wishlist["createdAt"],
                updatedAt: wishlist["updatedAt"]
            }));
        }

        // RECREATE WISHLIST
        const tags = [];

        for (const tagIndex in databaseDict["tags"]) {
            const tag = databaseDict["tags"][tagIndex];

            tags.push(Tags.upsert({
                id: tag["id"],
                user_id: tag["user_id"],
                name: tag["name"],
                emoji: tag["emoji"],
                createdAt: tag["createdAt"],
                updatedAt: tag["updatedAt"]
            }));
        }

        await Promise.all(users, userStats, userTitles, titleDatabase, userCards, userDailys, cardDatabase, userItems, userEventItems, itemShop, eventShop, serverInfo, wishlists);
    
        sequelize.close();
    }).catch(console.error);
    
    console.log('Database updated');
}

print()