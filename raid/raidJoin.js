const { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { raritySymbol, formatName } = require("../pullingObjects.js");
const Canvas = require('@napi-rs/canvas');
const { Users } = require("../dbObjects");
const raidBattle = require('./raidBattle.js')


function makeRaidEmbed(message, party, partyCount, time) {

    const raidEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Raid - Normal *001-Pidgey* [Preparing ${time}m...]`)
        .setThumbnail(`attachment://poke-image.png`)
        .setDescription(`Recommended Friendship Level: **XX** \n\n**Party (${partyCount}/4)** \n\`\`\`diff\n${party["1"]["text"]} \n${party["2"]["text"]} \n${party["3"]["text"]} \n${party["4"]["text"]} \`\`\` \n\nClick on the \`Join\` bellow to select your card and join.`)
        .setFooter( { text: `Requires Raiding Pass to Praticpate. Get one using 'c!buy RAIDING PASS 1' for 800 POKEDOLLARS.` })

    return raidEmbed;
}

function makeFailEmebed() {

    const raidEmbed = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setTitle(`Raid - Canceled`)
        .setThumbnail(`attachment://poke-image.png`)
        .setDescription(`Raid canceled due to incifient number of players.`)

    return raidEmbed;
}

function makeStartEmbed(party, partyCount) {

    const startEmbed = new EmbedBuilder()
        .setColor("#26bd0f")
        .setTitle(`Raid - Normal *001-Pidgey* [Starting]`)
        .setThumbnail(`attachment://poke-image.png`)
        .setDescription(`Recommended Friendship Level: **XX** \n\n**Party (${partyCount}/4)** \n\`\`\`diff\n${party["1"]["text"]} \n${party["2"]["text"]} \n${party["3"]["text"]} \n${party["4"]["text"]} \`\`\` \n\nPrepare to \`Fight\`!`)

    return startEmbed;
}

function makeChoiceEmbed(message, user) {

    const choiceEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Raid - Pick Card`)
        .setDescription(`<@${user.id}> type the code of the card you\'d like to use for the raid. \n\`\`\`diff\n- Not Selected -\n\n...\n\`\`\`\nClick on \`Confirm\` when you've mad your choice of card.`)

    return choiceEmbed;
}

function makeChoiceWrongEmbed(message, user) {

    const choiceEmbed = new EmbedBuilder()
        .setColor("#bd0f0f")
        .setTitle(`Raid - Pick Card`)
        .setDescription(`<@${user.id}> type the code of the card you\'d like to use for the raid. \n\`\`\`diff\n- Not Selected -\n\n...\n- ${message} is not a valid card! -\`\`\`\nClick on \`Confirm\` when you've mad your choice of card.`)

    return choiceEmbed;
}

function makeChoiceRightEmbed(card, user) {

    const choiceEmbed = new EmbedBuilder()
        .setColor("#26bd0f")
        .setTitle(`Raid - Pick Card`)
        .setDescription(`<@${user.id}> type the code of the card you\'d like to use for the raid. \n\`\`\`diff\n+ Selected + \n\n${card.item_id} ${formatName(card.item)} ${card.item.rarity} [${raritySymbol(card.item.rarity)}] Lv. ${card.level}\`\`\`\nClick on \`Confirm\` when you've mad your choice of card.`)

    return choiceEmbed;
}

function makeButton() {

    const joinButton = new ButtonBuilder()
        .setCustomId("join")
        .setStyle(ButtonStyle.Success)
        .setLabel("Join")

    const leaveButton = new ButtonBuilder()
        .setCustomId("leave")
        .setStyle(ButtonStyle.Danger)
        .setLabel("Leave")

    const changeButton = new ButtonBuilder()
        .setCustomId("change")
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Change")

    /// DEbug
    const startButton = new ButtonBuilder()
        .setCustomId("start")
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Start")

    const row = new ActionRowBuilder()
        .addComponents(joinButton, leaveButton, changeButton, startButton);

    return row;
}

function makeChoiceButton() {

    const confirmButton = new ButtonBuilder()
        .setCustomId("confirm")
        .setStyle(ButtonStyle.Success)
        .setLabel("Confirm")

    const cancelButton = new ButtonBuilder()
        .setCustomId("cancel")
        .setStyle(ButtonStyle.Danger)
        .setLabel("Cancel")

    const row = new ActionRowBuilder()
        .addComponents(confirmButton, cancelButton);

    return row;
}

module.exports = {
    name: "raidJoin",
        
    async execute(message) {
        let party = {
            "1": {
                text: "0 Waiting... ",
                dUser: null,
                user: null,
                card: null
            },
            "2": {
                text: "0 Waiting... ",
                dUser: null,
                user: null,
                card: null
            },
            "3": {
                text: "0 Waiting... ",
                dUser: null,
                user: null,
                card: null
            },
            "4": {
                text: "0 Waiting... ",
                dUser: null,
                user: null,
                card: null
            },
        };
        let time = 2;

        const canvas = Canvas.createCanvas(720, 1290);
        const context = canvas.getContext('2d');

        const img1 = await Canvas.loadImage(`./pokeImages/001-Pidgey.png`);
        const img2 = await Canvas.loadImage(`./pokeImages/frames/Normal-Frame.png`);

        context.drawImage(img1, 0, 0, img1.width, img1.height);
        context.drawImage(img2, 0, 0, img1.width, img1.height);

        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'poke-image.png' });

        let partyCollectors = {
            "1": {
                message: null,
                collector: null
            },
            "2": {
                message: null,
                collector: null
            },
            "3": {
                message: null,
                collector: null
            },
            "4": {
                message: null,
                collector: null
            }
        }

        let partyCount = 0
            
        const response = await message.channel.send({ embeds: [makeRaidEmbed(message, party, partyCount, time)], components: [makeButton()], files: [attachment] });

        let collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, idle: 120_000, time: 120_000 });
        const messageCollector = message.channel.createMessageCollector({ time: 120_000 });
        let starting = false

        collector.on("collect", async i => {
            let timeLeft = ((response.createdTimestamp + 120_000) - response.editedTimestamp) / 60_000;
            time = (timeLeft < time) ? Math.floor(timeLeft) : time;
            
            if (i.customId == "join") {
                for (const memberIndex in party) {
                    const member = party[memberIndex];
                    const memberCollector = partyCollectors[memberIndex]
                    const user = await Users.findOne({ where: { user_id: i.user.id } });
                    

                    if (member["user"] && member["user"].user_id == user.user_id) {
                        await response.edit({ embeds: [makeRaidEmbed(message, party, partyCount, time)], components: [makeButton()], files: [attachment] });
                        i.deferUpdate();
                        break;
                    };

                    if (!member["user"]) {
                        
                        member["user"] = user;
                        member["dUser"] = i.user;
                        partyCount += 1;

                        member["text"] = `- ${i.user.username} Making Choice...`;

                        if (memberCollector["message"] != null) {
                            memberCollector["message"].delete()
                            memberCollector["message"] = null                            
                        }
                        memberCollector["message"] = await message.channel.send({ embeds: [makeChoiceEmbed(message, i.user)], components: [makeChoiceButton()]});
                        memberCollector["collector"] = memberCollector["message"].createMessageComponentCollector({ componentType: ComponentType.Button, time: 120_000 });

                        memberCollector["collector"].on("collect", async _ => {
        
                            if (_.customId == "confirm") {
                                if (member["card"] && _.user.id == member["user"].user_id) {
                                    memberCollector["message"].delete()
                                    memberCollector["message"] = null;
                                    
                                    member["text"] = `+ ${_.user.username} ${member["card"].item_id} ${formatName(member["card"].item)} Lv. ${member["card"].level}`;
                                    await response.edit({ embeds: [makeRaidEmbed(message, party, partyCount, time)], components: [makeButton()], files: [attachment] });
                                }
                                else {
                                    _.deferUpdate();
                                };
                            }
                            else if (_.customId == "cancel") {
                    
                            };
                        });
                        
                        await response.edit({ embeds: [makeRaidEmbed(message, party, partyCount, time)], components: [makeButton()], files: [attachment] });
                        i.deferUpdate();
                        break;
                    };

                };
            }
            else if (i.customId == "leave") {
                for (const memberIndex in party) {
                    const member = party[memberIndex];
                    const user = await Users.findOne({ where: { user_id: i.user.id } });

                    if (!member["user"]) {
                        i.deferUpdate();
                        break;
                    };

                    if (member["user"].user_id == user.user_id) {
                        member["user"] = null;
                        partyCount -= 1;

                        member["text"] = `0 Waiting...`;

                        member["card"] = null;

                        await response.edit({ embeds: [makeRaidEmbed(message, party, partyCount, time)], components: [makeButton()], files: [attachment] });
                        i.deferUpdate();
                    };
                };
            }
            else if (i.customId == "change") {
                for (const memberIndex in party) {
                    const member = party[memberIndex];
                    const memberCollector = partyCollectors[memberIndex]
                    const user = await Users.findOne({ where: { user_id: i.user.id } });

                    if (member["user"] && user && member["user"].user_id == user.user_id) {

                        if (!member["card"]) {
                            i.deferUpdate();
                            continue;
                        }

                        if (memberCollector["message"] != null) {
                            memberCollector["message"].delete()
                            memberCollector["message"] = null                            
                        }

                        memberCollector["message"] = await message.channel.send({ embeds: [makeChoiceRightEmbed(member["card"], i.user)], components: [makeChoiceButton()]});
                        memberCollector["collector"] = memberCollector["message"].createMessageComponentCollector({ componentType: ComponentType.Button, time: 120_000 });
                        startCollector(memberCollector, memberIndex, message, partyCount, response, attachment);
                        
                        await response.edit({ embeds: [makeRaidEmbed(message, party, partyCount, time)], components: [makeButton()], files: [attachment] });
                        i.deferUpdate();
                    }
                };
            }
            /// Debug
            else if (i.customId == "start") {
                collector.stop();
            };
        });

        collector.on("end", async i => {
            let memeberNotCount = 0;
            for (memberIndex in party) {
                const member = party[memberIndex];
                const memeberCollector = partyCollectors[memberIndex];

                if (memeberCollector["message"]) {
                    memeberCollector["message"].delete();
                    memeberCollector["message"] = null;
                };
                memeberCollector["collector"] = null;

                if (!member["user"] || !member["card"]) {
                    memeberNotCount += 1
                    member["user"] = null
                    member["card"] = null
                    member["text"] = "- NA"
                };
            };

            if (memeberNotCount == 4) {
                await response.edit({ embeds: [makeFailEmebed()], components: [], files: [attachment] });
                return;
            };
            collector = null
            await response.edit({ embeds: [makeStartEmbed(party, partyCount)], components: [], files: [attachment] });
            await raidBattle.execute(response, party, partyCount, attachment);
        });

        messageCollector.on('collect', async m => {
            for (const memberIndex in party) {
                const member = party[memberIndex];
                const memberCollector = partyCollectors[memberIndex]
                const user = await Users.findOne({ where: { user_id: m.author.id } });

                if (user && member["user"] && member["user"].user_id == user.user_id && memberCollector["message"]) {
                    const userCards = await user.getCards();
                    let changed = false

                    for (const card of userCards) {
                        if (card.item_id == m.content.toLowerCase()) {
                            member["card"] = card;
                            
                            changed = true;
                            m.delete()

                            await memberCollector["message"].edit({ embeds: [makeChoiceRightEmbed(card, m.author)], components: [makeChoiceButton()]});
                        };
                    };
                    if (!changed) {
                        m.delete()
                        await memberCollector["message"].edit({ embeds: [makeChoiceWrongEmbed(m.content, m.author)], components: [makeChoiceButton()]});
                        
                    };
                };
            };
        });

    },
}