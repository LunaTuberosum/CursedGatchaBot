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
require('./models/Users.js')(sequelize, Sequelize.DataTypes);
require('./models/UserCards.js')(sequelize, Sequelize.DataTypes);
require('./models/UserItems.js')(sequelize, Sequelize.DataTypes);
require('./models/ServerInfo.js')(sequelize, Sequelize.DataTypes);
require('./models/Wishlists.js')(sequelize, Sequelize.DataTypes);
require('./models/Tags.js')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');

const folderPath = path.join(__dirname, 'pokeImages');
const imageFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.png'));

sequelize.sync({ force }).then(async () => {
	const database = [ ];

	for (const card in allCards) {
		database.push(CardDatabase.upsert({ 
			name: allCards[card]["Name"],
			type: allCards[card]["Type"],
			card_id: allCards[card]["CardID"],
			drawn_date: allCards[card]["DrawDate"],
			poke_number: allCards[card]["Poke#"],
			rarity: allCards[card]["Rarity"],
			card_type: allCards[card]["CardType"],
			series: allCards[card]["Series"]})
		);
	}

	const shop = [
		ItemShop.upsert({ name: 'POKEDOLLAR', emoji: ":yen:", itemCost: "POKEDOLLAR", cost: 0, description: "The primary currency." }),

		ItemShop.upsert({ name: 'NORMAL SHARD', emoji: ":small_orange_diamond:", itemCost: "GHOST SHARD", cost: 3, description: "A shard of Normal energy." }),
		ItemShop.upsert({ name: 'FIRE SHARD', emoji: ":small_orange_diamond:", itemCost: "WATER SHARD", cost: 3, description: "A shard of Fire energy." }),
		ItemShop.upsert({ name: 'WATER SHARD', emoji: ":small_orange_diamond:", itemCost: "FIRE SHARD", cost: 3, description: "A shard of Water energy." }),
		ItemShop.upsert({ name: 'GRASS SHARD', emoji: ":small_orange_diamond:", itemCost: "POISON SHARD", cost: 3, description: "A shard of Grass energy." }),
		ItemShop.upsert({ name: 'ELECTRIC SHARD', emoji: ":small_orange_diamond:", itemCost: "GROUND SHARD", cost: 3, description: "A shard of Electric energy." }),
		ItemShop.upsert({ name: 'ICE SHARD', emoji: ":small_orange_diamond:", itemCost: "ROCK SHARD", cost: 3, description: "A shard of Ice energy." }),
		ItemShop.upsert({ name: 'FIGHTING SHARD', emoji: ":small_orange_diamond:", itemCost: "PSYCHIC SHARD", cost: 3, description: "A shard of Fighting energy." }),
		ItemShop.upsert({ name: 'POISON SHARD', emoji: ":small_orange_diamond:", itemCost: "GRASS SHARD", cost: 3, description: "A shard of Poison energy." }),
		ItemShop.upsert({ name: 'GROUND SHARD', emoji: ":small_orange_diamond:", itemCost: "ELECTRIC SHARD", cost: 3, description: "A shard of Ground energy." }),
		ItemShop.upsert({ name: 'PSYCHIC SHARD', emoji: ":small_orange_diamond:", itemCost: "FIGHTING SHARD", cost: 3, description: "A shard of Psychic energy." }),
		ItemShop.upsert({ name: 'BUG SHARD', emoji: ":small_orange_diamond:", itemCost: "FLYING SHARD", cost: 3, description: "A shard of Bug energy." }),
		ItemShop.upsert({ name: 'FLYING SHARD', emoji: ":small_orange_diamond:", itemCost: "BUG SHARD", cost: 3, description: "A shard of Flying energy." }),
		ItemShop.upsert({ name: 'ROCK SHARD', emoji: ":small_orange_diamond:", itemCost: "ICE SHARD", cost: 3, description: "A shard of Rock energy." }),
		ItemShop.upsert({ name: 'GHOST SHARD', emoji: ":small_orange_diamond:", itemCost: "NORMAL SHARD", cost: 3, description: "A shard of Ghost energy." }),
		ItemShop.upsert({ name: 'DRAGON SHARD', emoji: ":small_orange_diamond:", itemCost: "FAIRY SHARD", cost: 3, description: "A shard of Dragon energy." }),
		ItemShop.upsert({ name: 'DARK SHARD', emoji: ":small_orange_diamond:", itemCost: "STEEL SHARD", cost: 3, description: "A shard of Dark energy." }),
		ItemShop.upsert({ name: 'STEEL SHARD', emoji: ":small_orange_diamond:", itemCost: "DARK SHARD", cost: 3, description: "A shard of Steek energy." }),
		ItemShop.upsert({ name: 'FAIRY SHARD', emoji: ":small_orange_diamond:", itemCost: "DRAGON SHARD", cost: 3, description: "A shard of Fairy energy." }),

		ItemShop.upsert({ name: 'NORMAL GEM', emoji: ":large_orange_diamond:", itemCost: "POKEDOLLAR", cost: 0, description: "A crystalized gem of Normal energy." }),
		ItemShop.upsert({ name: 'FIRE GEM', emoji: ":large_orange_diamond:", itemCost: "POKEDOLLAR", cost: 0, description: "A crystalized gem of Fire energy." }),
		ItemShop.upsert({ name: 'WATER GEM', emoji: ":large_orange_diamond:", itemCost: "POKEDOLLAR", cost: 0, description: "A crystalized gem of Water energy." }),
		ItemShop.upsert({ name: 'GRASS GEM', emoji: ":large_orange_diamond:", itemCost: "POKEDOLLAR", cost: 0, description: "A crystalized gem of Grass energy." }),
		ItemShop.upsert({ name: 'ELECTRIC GEM', emoji: ":large_orange_diamond:", itemCost: "POKEDOLLAR", cost: 0, description: "A crystalized gem of Electric energy." }),
		ItemShop.upsert({ name: 'ICE GEM', emoji: ":large_orange_diamond:", itemCost: "POKEDOLLAR", cost: 0, description: "A crystalized gem of Ice energy." }),
		ItemShop.upsert({ name: 'FIGHTING GEM', emoji: ":large_orange_diamond:", itemCost: "POKEDOLLAR", cost: 0, description: "A crystalized gem of Fighting energy." }),
		ItemShop.upsert({ name: 'POSION GEM', emoji: ":large_orange_diamond:", itemCost: "POKEDOLLAR", cost: 0, description: "A crystalized gem of Poison energy." }),
		ItemShop.upsert({ name: 'GROUND GEM', emoji: ":large_orange_diamond:", itemCost: "POKEDOLLAR", cost: 0, description: "A crystalized gem of Ground energy." }),
		ItemShop.upsert({ name: 'PSYCHIC GEM', emoji: ":large_orange_diamond:", itemCost: "POKEDOLLAR", cost: 0, description: "A crystalized gem of Psychic energy." }),
		ItemShop.upsert({ name: 'BUG GEM', emoji: ":large_orange_diamond:", itemCost: "POKEDOLLAR", cost: 0, description: "A crystalized gem of Bug energy." }),
		ItemShop.upsert({ name: 'FLYING GEM', emoji: ":large_orange_diamond:", itemCost: "POKEDOLLAR", cost: 0, description: "A crystalized gem of Flying energy." }),
		ItemShop.upsert({ name: 'ROCK GEM', emoji: ":large_orange_diamond:", itemCost: "POKEDOLLAR", cost: 0, description: "A crystalized gem of Rock energy." }),
		ItemShop.upsert({ name: 'GHOST GEM', emoji: ":large_orange_diamond:", itemCost: "POKEDOLLAR", cost: 0, description: "A crystalized gem of Ghost energy." }),
		ItemShop.upsert({ name: 'DRAGON GEM', emoji: ":large_orange_diamond:", itemCost: "POKEDOLLAR", cost: 0, description: "A crystalized gem of Dragon energy." }),
		ItemShop.upsert({ name: 'DARK GEM', emoji: ":large_orange_diamond:", itemCost: "POKEDOLLAR", cost: 0, description: "A crystalized gem of Dark energy." }),
		ItemShop.upsert({ name: 'STEEL GEM', emoji: ":large_orange_diamond:", itemCost: "POKEDOLLAR", cost: 0, description: "A crystalized gem of Steek energy." }),
		ItemShop.upsert({ name: 'FAIRY GEM', emoji: ":large_orange_diamond:", itemCost: "POKEDOLLAR", cost: 0, description: "A crystalized gem of Fairy energy." }),

		ItemShop.upsert({ name: 'DRAW 3', emoji: ":small_blue_diamond:", itemCost: "POKEDOLLAR", cost: 300, description: "An item that lets you draw 3 cards instead of 2." }),
		ItemShop.upsert({ name: 'DRAW 5', emoji: ":large_blue_diamond:", itemCost: "POKEDOLLAR", cost: 500, description: "An item that lets you draw 5 card instead of 2." }),
		ItemShop.upsert({ name: 'EXTRA GRAB', emoji: ":small_red_triangle:", itemCost: "POKEDOLLAR", cost: 250, description: "An item that lets you try again to get a raid card or grab another card on a pull." }),
		ItemShop.upsert({ name: 'RAIDING PASS', emoji: ":receipt:", itemCost: "POKEDOLLAR", cost: 800, description: "A pass that lets you start raiding." }),
		ItemShop.upsert({ name: 'FULL RESTORE', emoji: ":test_tube:", itemCost: "POKEDOLLAR", cost: 1000, description: "An item that lets you fully heal your card after a raid." }),
		ItemShop.upsert({ name: 'RAID LURE', emoji: ":wind_chime:", itemCost: "POKEDOLLAR", cost: 1500, description: "An item that will summon a raid." }),

		ItemShop.upsert({ name: 'SPECIAL ITEM', emoji: ":trident:", itemCost: "POKEDOLLAR", cost: 0, description: "Special." }),

	];

	await Promise.all(database, shop);
	console.log('Database synced');

	sequelize.close();
}).catch(console.error);