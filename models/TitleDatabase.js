module.exports = (sequelize, DataTypes) => {
	return sequelize.define('title_database', {
		name: {
			type: DataTypes.STRING,
			unique: true,
		},
		description: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};