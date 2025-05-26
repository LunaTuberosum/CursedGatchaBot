module.exports = (sequelize, DataTypes) => {
	return sequelize.define('event_shop', {
		name: {
			type: DataTypes.STRING,
		},
        emoji: {
			type: DataTypes.STRING,
		},
        event: {
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