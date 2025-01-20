
module.exports = (sequelize, DataTypes) => {
	return sequelize.define('user_dailys', {
		user_id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},

        month: {
            type: DataTypes.INTEGER,
            default: "-1",
            allowNull: false
        },
        day: {
            type: DataTypes.INTEGER,
            default: "-1",
            allowNull: false
        },
	}, {
		timestamps: false,
	});
};