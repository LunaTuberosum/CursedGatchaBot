const Sequelize = require('sequelize');
const { Collection } = require('discord.js');


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
const CardDatabase = require('./models/CardDatabase.js')(sequelize, Sequelize.DataTypes);
const UserItems = require('./models/UserItems.js')(sequelize, Sequelize.DataTypes);
const ItemShop = require('./models/ItemShop.js')(sequelize, Sequelize.DataTypes);
const ServerInfo = require('./models/ServerInfo.js')(sequelize, Sequelize.DataTypes);
const Wishlists = require('./models/Wishlists.js')(sequelize, Sequelize.DataTypes);
const Tags = require('./models/Tags.js')(sequelize, Sequelize.DataTypes);

UserCards.belongsTo(CardDatabase, { foreignKey: 'item_info', as: 'item' });
UserItems.belongsTo(ItemShop, { foreignKey: 'item_id', as: 'item' });

Reflect.defineProperty(Users.prototype, 'addCard', {
	/* eslint-disable-next-line func-name-matching */
	value: async function addCard(item, itemInfo) {
		
		return UserCards.create({ user_id: this.user_id, item_id: item, item_info: itemInfo.id });
	},
});

Reflect.defineProperty(Users.prototype, 'getCards', {
	/* eslint-disable-next-line func-name-matching */
	value: function getCards() {
		return UserCards.findAll({
			where: { user_id: this.user_id },
			include: ['item'],
		});
	},
});

Reflect.defineProperty(Users.prototype, 'addItem', {
	/* eslint-disable-next-line func-name-matching */
	value: async function addItem(item, amount) {

		try {
			const userItem = await UserItems.findOne({
				where: { user_id: this.user_id, item_id: item.id },
			});

			userItem.amount += Number(amount);
			return userItem.save();

		} catch (error) {
			return UserItems.create({ user_id: this.user_id, item_id: item.id, amount: Number(amount) });
			
		}
		

	},
});

Reflect.defineProperty(Users.prototype, 'getItems', {
	/* eslint-disable-next-line func-name-matching */
	value: function getItems() {
		return UserItems.findAll({
			where: { user_id: this.user_id },
			include: ['item'],
		});
	},
});

module.exports = { Users, UserStats, UserTitles, TitleDatabase, UserCards, CardDatabase, UserItems, ItemShop, Wishlists, Tags, ServerInfo };