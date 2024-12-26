
module.exports = (sequelize, DataTypes) => {
	return sequelize.define('users', {
		user_id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		user_code: {
			type: DataTypes.STRING,
			allowNull: false
		},
		last_code: DataTypes.STRING,
		pull_cooldown: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		grab_cooldown: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		wishlist_channel: {
			type: DataTypes.INTEGER,
		}
	}, {
		timestamps: true,
	});
};