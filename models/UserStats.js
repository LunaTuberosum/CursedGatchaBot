
module.exports = (sequelize, DataTypes) => {
	return sequelize.define('user_stats', {
		user_id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},

        // USER DATA
        register_date: {
            type: DataTypes.STRING,
            default: "1/1/0001",
            allowNull: false
        },

        // CARD DATA
		card_released: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		card_drawn: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		card_grabbed: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		// shiny_grabbed: {
		// 	type: DataTypes.INTEGER,
		// 	defaultValue: 0,
		// 	allowNull: false,
		// },

        // ITEM DATA
        money_spent: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
		money_own: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        }
	}, {
		timestamps: true,
	});
};