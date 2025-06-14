module.exports = (sequelize, DataTypes) => {
	return sequelize.define('charm_shop', {
		name: {
			type: DataTypes.STRING,
		},
        emoji: {
			type: DataTypes.STRING,
		},
        event: {
			type: DataTypes.STRING,
		},

		gemName: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		gemCost: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},

        shardName: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		shardCost: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},

        itemName: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		itemCost: {
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