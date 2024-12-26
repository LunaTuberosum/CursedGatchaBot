
module.exports = (sequelize, DataTypes) => {
	return sequelize.define('pullData', {
		server_id: {
			type: DataTypes.INTEGER,
		},
		pull_channel: {
			type: DataTypes.INTEGER,
		},
		raid_channel: {
			type: DataTypes.INTEGER,
		}
	}, {
		timestamps: false,
	});
};