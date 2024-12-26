module.exports = (sequelize, DataTypes) => {
	return sequelize.define('item_shop', {
		name: {
			type: DataTypes.STRING,
			unique: true,
		},
        emoji: {
			type: DataTypes.STRING,
		},
		itemCost: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		cost: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		description: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};