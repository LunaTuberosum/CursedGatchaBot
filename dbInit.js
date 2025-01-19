const Sequelize = require('sequelize');
const path = require('node:path');
const fs = require('node:fs');
const allCards = require("./packs/allCards.json");

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const CardDatabase = require('./models/CardDatabase.js')(sequelize, Sequelize.DataTypes);
const ItemShop = require('./models/ItemShop.js')(sequelize, Sequelize.DataTypes);
const TitleDatabase = require('./models/TitleDatabase.js')(sequelize, Sequelize.DataTypes);
require('./models/Users.js')(sequelize, Sequelize.DataTypes);
require('./models/UserCards.js')(sequelize, Sequelize.DataTypes);
require('./models/UserItems.js')(sequelize, Sequelize.DataTypes);
require('./models/UserStats.js')(sequelize, Sequelize.DataTypes);
require('./models/UserTitles.js')(sequelize, Sequelize.DataTypes);
require('./models/ServerInfo.js')(sequelize, Sequelize.DataTypes);
require('./models/Wishlists.js')(sequelize, Sequelize.DataTypes);
require('./models/Tags.js')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	const database = [ ];

	for (const series in allCards) {
		
		for (const card in allCards[series])
			database.push(CardDatabase.upsert({ 
				name: allCards[series][card]["Name"],
				type: allCards[series][card]["Type"],
				card_id: allCards[series][card]["CardID"],
				drawn_date: allCards[series][card]["DrawDate"],
				poke_number: allCards[series][card]["Poke#"],
				rarity: allCards[series][card]["Rarity"],
				card_type: allCards[series][card]["CardType"],
				poke_type: allCards[series][card]["PokeType"],
				series: allCards[series][card]["Series"],
				obtain: allCards[series][card]["Obtain"]})
			);
	}

	const shop = [
		ItemShop.upsert({ name: 'POKEDOLLAR', emoji: ":yen:", itemCost: "POKEDOLLAR", cost: 0, description: "The primary currency." }),

		ItemShop.upsert({ name: 'GRASS SHARD', emoji: ":small_orange_diamond:", itemCost: "FIRE SHARD", cost: 3, description: "A shard of Grass energy." }),
		ItemShop.upsert({ name: 'FIRE SHARD', emoji: ":small_orange_diamond:", itemCost: "WATER SHARD", cost: 3, description: "A shard of Fire energy." }),
		ItemShop.upsert({ name: 'WATER SHARD', emoji: ":small_orange_diamond:", itemCost: "LIGHTNING SHARD", cost: 3, description: "A shard of Water energy." }),
		ItemShop.upsert({ name: 'LIGHTNING SHARD', emoji: ":small_orange_diamond:", itemCost: "FIGHTING SHARD", cost: 3, description: "A shard of Lightning energy." }),
		ItemShop.upsert({ name: 'PSYCHIC SHARD', emoji: ":small_orange_diamond:", itemCost: "STEEL SHARD", cost: 3, description: "A shard of Psychic energy." }),
		ItemShop.upsert({ name: 'FIGHTING SHARD', emoji: ":small_orange_diamond:", itemCost: "GRASS SHARD", cost: 3, description: "A shard of Fighting energy." }),
		ItemShop.upsert({ name: 'DARK SHARD', emoji: ":small_orange_diamond:", itemCost: "FIGHTING SHARD", cost: 3, description: "A shard of Dark energy." }),
		ItemShop.upsert({ name: 'METAL SHARD', emoji: ":small_orange_diamond:", itemCost: "FIRE SHARD", cost: 3, description: "A shard of Metal energy." }),
		ItemShop.upsert({ name: 'DRAGON SHARD', emoji: ":small_orange_diamond:", itemCost: "COLORLESS SHARD", cost: 3, description: "A shard of Dragon energy." }),
		ItemShop.upsert({ name: 'COLORLESS SHARD', emoji: ":small_orange_diamond:", itemCost: "DRAGON SHARD", cost: 3, description: "A shard of Colorless energy." }),

		ItemShop.upsert({ name: 'GRASS GEM', emoji: ":large_orange_diamond:", itemCost: "GRASS SHARD", cost: 10, description: "A crystalized gem of Grass energy." }),
		ItemShop.upsert({ name: 'FIRE GEM', emoji: ":large_orange_diamond:", itemCost: "FIRE SHARD", cost: 10, description: "A crystalized gem of Fire energy." }),
		ItemShop.upsert({ name: 'WATER GEM', emoji: ":large_orange_diamond:", itemCost: "WATER SHARD", cost: 10, description: "A crystalized gem of Water energy." }),
		ItemShop.upsert({ name: 'LIGHTNING GEM', emoji: ":large_orange_diamond:", itemCost: "LIGHTNING SHARD", cost: 10, description: "A crystalized gem of Lightning energy." }),
		ItemShop.upsert({ name: 'PSYCHIC GEM', emoji: ":large_orange_diamond:", itemCost: "PSYCHIC SHARD", cost: 10, description: "A crystalized gem of Psychic energy." }),
		ItemShop.upsert({ name: 'FIGHTING GEM', emoji: ":large_orange_diamond:", itemCost: "FIGHTING SHARD", cost: 10, description: "A crystalized gem of Fighting energy." }),
		ItemShop.upsert({ name: 'DARK GEM', emoji: ":large_orange_diamond:", itemCost: "DARK SHARD", cost: 10, description: "A crystalized gem of Dark energy." }),
		ItemShop.upsert({ name: 'METAL GEM', emoji: ":large_orange_diamond:", itemCost: "METAL SHARD", cost: 10, description: "A crystalized gem of Metal energy." }),
		ItemShop.upsert({ name: 'DRAGON GEM', emoji: ":large_orange_diamond:", itemCost: "DRAGON SHARD", cost: 10, description: "A crystalized gem of Dragon energy." }),
		ItemShop.upsert({ name: 'COLORLESS GEM', emoji: ":large_orange_diamond:", itemCost: "COLORLESS SHARD", cost: 10, description: "A crystalized gem of Normal energy." }),

		ItemShop.upsert({ name: 'SMALL PACK', emoji: ":small_blue_diamond:", itemCost: "POKEDOLLAR", cost: 300, description: "An item that draws 3 cards for you. With at least one Uncommon or greater." }),
		ItemShop.upsert({ name: 'BIG PACK', emoji: ":large_blue_diamond:", itemCost: "POKEDOLLAR", cost: 500, description: "An item that draws 5 cards for you. With at least one Rare or greater." }),
		ItemShop.upsert({ name: 'GREAT BALL', emoji: ":blue_circle:", itemCost: "POKEDOLLAR", cost: 250, description: "An item that lets you try again to get a raid card or grab another card on a pull." }),
		// ItemShop.upsert({ name: 'RAIDING PASS', emoji: ":receipt:", itemCost: "POKEDOLLAR", cost: 800, description: "A pass that lets you start raiding." }),
		// ItemShop.upsert({ name: 'FULL RESTORE', emoji: ":test_tube:", itemCost: "POKEDOLLAR", cost: 1000, description: "An item that lets you fully heal your card during a raid." }),
		// ItemShop.upsert({ name: 'RAID LURE', emoji: ":wind_chime:", itemCost: "POKEDOLLAR", cost: 1500, description: "An item that will summon a raid." }),

		ItemShop.upsert({ name: 'SPECIAL ITEM', emoji: ":trident:", itemCost: "POKEDOLLAR", cost: 0, description: "Special." }),

	];

	const title = [
		TitleDatabase.upsert({ name: 'Developer', description: 'Made the bot.' }),
		TitleDatabase.upsert({ name: '"Artist"', description: 'Drew the cards herself.' }),
		TitleDatabase.upsert({ name: 'Trash Collector', description: 'Has collected all cards in the EVE1 pack.' }),
		TitleDatabase.upsert({ name: 'Catch and Release', description: 'Has released 100 cards' }),
		TitleDatabase.upsert({ name: 'Litterer', description: 'Has pulled 100 cards.' }),
		TitleDatabase.upsert({ name: 'One Man\'s Trash', description: 'Has grabbed 100 cards.' })
	];

	await Promise.all(database, shop, title);
	console.log('Database synced');

	sequelize.close();
}).catch(console.error);