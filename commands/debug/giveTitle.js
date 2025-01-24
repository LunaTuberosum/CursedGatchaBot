const { TitleDatabase, UserTitles, Users } = require("../../dbObjects");

module.exports = {
    name: "giveTitle",
    shortName: ["gt"],
        
    async execute(message) {
        if (message.member.permissionsIn(message.channel).has("ADMINISTRATOR")) {
            const splitMessage = message.content.split(" ");

            if (splitMessage < 3) { await message.channel.send(`${message.author}, please include the user you would like to grant a title to and the title you'd like to grant.`); return; }

            const user = await Users.findOne({ where: { user_id: message.mentions.users.first().id } });

            if (!user) { await message.channel.send(`${message.author}, that user either doesn't exist or is not registered yet. To have them register, have them use \`g!register\`.`); return; }

            let titleNameList = [];

            for (let i = 2; i < splitMessage.length; i++) {
                titleNameList.push(splitMessage[i]);
            }

            const titleName = titleNameList.join(" ")

            const titleData = await TitleDatabase.findOne({ where: { name: titleName } });

            if (!titleData) { await message.channel.send(`${message.author}, the title you entered either dosen't exist or is misspelt.`); return; }

            const userTitle = await UserTitles.findOne({ where: { user_id: user.user_id, title_id: titleData.id } });
            
            if (userTitle) { UserTitles.destroy({ where: { user_id: user.user_id, title_id: titleData.id } }); await message.channel.send(`${message.author}, user has lost that title.`); return; }

            await UserTitles.create({ user_id: user.user_id, title_id: titleData.id });

            await message.channel.send(`${message.author}, user has been given that title.`)

        }
        else {
            return;
        }
    }
};