
module.exports = (sequelize, DataTypes) => {
	return sequelize.define('user_cards', {
		user_id: DataTypes.STRING,
		item_id: DataTypes.INTEGER,
		item_info: DataTypes.STRING,

		level: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		attack: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		defence: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		speed: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},

		tag: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: "None"
		},

		charm_1: DataTypes.STRING,
		charm_2: DataTypes.STRING,
		charm_3: DataTypes.STRING,
	}, {
		timestamps: true,
	});
};