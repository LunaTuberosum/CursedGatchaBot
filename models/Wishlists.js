
module.exports = (sequelize, DataTypes) => {
	return sequelize.define('wishlist', {
		user_id: DataTypes.STRING,
		card_id: DataTypes.STRING,
		card_type: DataTypes.STRING,
	}, {
		timestamps: true,
	});
};