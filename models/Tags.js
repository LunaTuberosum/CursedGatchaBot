
module.exports = (sequelize, DataTypes) => {
	return sequelize.define('tag', {
		user_id: DataTypes.STRING,
		name: DataTypes.STRING,
		emoji: DataTypes.STRING,
	}, {
		timestamps: true,
	});
};