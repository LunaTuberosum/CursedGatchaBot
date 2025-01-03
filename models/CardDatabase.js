
module.exports = (sequelize, DataTypes) => {
	return sequelize.define('card_database', {
		name: {
			type: DataTypes.STRING,
		},
		type: {
			type: DataTypes.STRING,
		},
		card_id: {
			type: DataTypes.STRING,
		},
		drawn_date: {
			type: DataTypes.STRING,
		},
        poke_number: {
			type: DataTypes.STRING,
		},
        rarity: {
			type: DataTypes.STRING,
		},
        card_type: {
			type: DataTypes.STRING,
		},
        poke_type: {
			type: DataTypes.STRING,
		},
        series: {
			type: DataTypes.STRING,
		},
		obtain: {
			type: DataTypes.STRING,
		},

		times_pulled: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		in_circulation: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};