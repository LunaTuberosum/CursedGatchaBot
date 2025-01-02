
module.exports = (sequelize, DataTypes) => {
	return sequelize.define('user_titles', {
		user_id: {
			type: DataTypes.STRING,
		},

        title_id: DataTypes.INTEGER
	}, {
		timestamps: true,
	});
};