const { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { raritySymbol, formatName } = require("../pullingObjects.js");
const Canvas = require('@napi-rs/canvas');
const { Users } = require("../dbObjects");

function makeRaidEmbed(party, partyStat, bossStat) {

    const raidEmbed = new EmbedBuilder()
        .setColor("#616161")
        .setTitle(`Raid - Normal *001-Pidgey* [Battling]`)
        .setThumbnail(`attachment://poke-image.png`)
        .setDescription(`Pidgey's Health: \`${bossStat["healthBar"]}\` - ${Math.floor((bossStat["health"] / bossStat["maxHealth"]) * 100)}% Remains\`\`\`${bossStat["text"]}\`\`\`\n*Party Info*\n\`\`\`${party["1"]["text"]}\n${party["2"]["text"]}\n${party["3"]["text"]}\n${party["4"]["text"]}\`\`\`\nPress \`Attack\` to attack the pokemon.\nPress \`Special\` if your card can use its special.\nPress \`Restore\` if you have a *Full Restore* to recover health.\n\n*Passive* info is in () next to your pokemon.`)
        .setFooter( { text: `Special build up is based on your pokemon\'s Passives and Attacks.` })

    return raidEmbed;
}

function makeRaidButton() {

    const attackButton = new ButtonBuilder()
        .setCustomId("attack")
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Attack")

    const specialButton = new ButtonBuilder()
        .setCustomId("special")
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Special")

    const restoreButton = new ButtonBuilder()
        .setCustomId("restore")
        .setStyle(ButtonStyle.Success)
        .setLabel("Restore")

    const row = new ActionRowBuilder()
        .addComponents(attackButton, specialButton, restoreButton);

    return row;
}

function makeHealthBar(maxHealth, curHealth) {
    const green = "🟩";
    const red = "🟥";
    let curHealthSquares = Math.floor(curHealth / 20); 
    
    let healthBar = "";

    for (let health = 1; health <= (maxHealth / 20); health++) {
        if (health <= curHealthSquares) {
            healthBar += green;
        }
        else {
            healthBar += red;
        }
    }

    return healthBar;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max) + 1;
}

function bossAttack(party, partyStat, bossStat, partyCount) {
    const rand = getRandomInt(partyCount).toString();
    const member = party[rand];
    const memberStat = partyStat[rand];
    
    if (member["user"]) {
        memberStat["health"] = Math.max(memberStat["health"] - bossStat["attack"], 0);
        
        bossStat["text"] = `Pidgey attacked ${member["dUser"].username}\'s pokemon!`;
        memberStat["healthBar"] = makeHealthBar(memberStat["maxHealth"], memberStat["health"]);
        
        member["text"] = `${member["dUser"].username} ${member["card"].item_id} ${formatName(member["card"].item)} Lv. ${member["card"].level}\n:: [${memberStat["healthBar"]}] {${partyStat[memberIndex]["special"]}%} ${memberStat["justAttacked"] ? "💥" : ""}\n`
    }
    else {
        bossAttack(party, partyStat, bossStat);
    }
    bossStat["attackCounter"] = 0;
}

module.exports = {
    name: "raidBattle",
        
    async execute(message, party, partyCount, attachment) {

        bossStat = {
            "text": "Pidgey readys to attack.",
            "health": 240,
            "maxHealth": 240,
            "healthBar": makeHealthBar(240, 240),
            "attackCounter": 0,
            "attack": 10
        }

        partyStat = {
            "1": {
                "maxHealth": 100,
                "health": 100,
                "healthBar": makeHealthBar(100, 100),
                "attackCounter": 0,
                "justAttacked": false,
                "special": 0
            },
            "2": {
                "maxHealth": 100,
                "health": 100,
                "healthBar": makeHealthBar(100, 100),
                "attackCounter": 0,
                "justAttacked": false,
                "special": 0
            },
            "3": {
                "maxHealth": 100,
                "health": 100,
                "healthBar": makeHealthBar(100, 100),
                "attackCounter": 0,
                "justAttacked": false,
                "special": 0
            },
            "4": {
                "maxHealth": 100,
                "health": 100,
                "healthBar": makeHealthBar(100, 100),
                "attackCounter": 0,
                "justAttacked": false,
                "special": 0
            }
        }

        for (memberIndex in party) {
            const member = party[memberIndex];
            if (member["user"]) {
                member["text"] = `${member["dUser"].username} ${member["card"].item_id} ${formatName(member["card"].item)} Lv. ${member["card"].level}\n:: [${partyStat[memberIndex]["healthBar"]}] {${partyStat[memberIndex]["special"]}%} ${partyStat[memberIndex]["justAttacked"] ? "💥" : ""}\n`
            }
            else {
                member["text"] = `NA ------ NA Lv. - \n:: [-] {0%}\n`;
            };
        };

        response = await message.edit({ embeds: [makeRaidEmbed(party, partyStat, bossStat)], components: [makeRaidButton()], files: [attachment] });

        let collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, idle: 120_000, time: 120_000 });

        collector.on("collect", i => {

            if (i.customId == "attack") {

                for (memberIndex in party) {
                    const member = party[memberIndex];

                    if (member["user"] && member["user"].user_id == i.user.id) {
                        partyStat[memberIndex]["attackCounter"]++;
                        let counter = partyStat[memberIndex]["attackCounter"];
                        
                        if (counter == 4) {
                            partyStat[memberIndex]["attackCounter"] = 0;
                            partyStat[memberIndex]["justAttacked"] = true; 
                            partyStat[memberIndex]["special"] = Math.min(partyStat[memberIndex]["special"] + 10, 100);

                            member["text"] = `${member["dUser"].username} ${member["card"].item_id} ${formatName(member["card"].item)} Lv. ${member["card"].level}\n:: [${partyStat[memberIndex]["healthBar"]}] {${partyStat[memberIndex]["special"]}%} ${partyStat[memberIndex]["justAttacked"] ? "💥" : ""}\n`;

                            bossStat["health"] = Math.max(bossStat["health"] - 20, 0);
                            bossStat["attackCounter"]++;
                            if (bossStat["attackCounter"] == 4) bossAttack(party, partyStat, bossStat, partyCount);
                        }
                        else if (counter == 1) {
                            partyStat[memberIndex]["justAttacked"] = false; 
                            member["text"] = `${member["dUser"].username} ${member["card"].item_id} ${formatName(member["card"].item)} Lv. ${member["card"].level}\n:: [${partyStat[memberIndex]["healthBar"]}] {${partyStat[memberIndex]["special"]}%} ${partyStat[memberIndex]["justAttacked"] ? "💥" : ""}\n`;
                        }
                    }
                }
                bossStat['healthBar'] = makeHealthBar(bossStat["maxHealth"], bossStat["health"]);
            }
            else if (i.customId == "special") {
                for (memberIndex in party) {
                    const member = party[memberIndex];
                    const memberStat = partyStat[memberIndex];

                    if (member["dUser"] && member["dUser"].id == i.user.id && memberStat["special"] == 100) {
                        bossStat["health"] = Math.max(bossStat["health"] - 40, 0);
                        bossStat["attackCounter"]++;
                        memberStat["special"] = 0;
                        bossStat['healthBar'] = makeHealthBar(bossStat["maxHealth"], bossStat["health"]);
                        member["text"] = `${member["dUser"].username} ${member["card"].item_id} ${formatName(member["card"].item)} Lv. ${member["card"].level}\n:: [${partyStat[memberIndex]["healthBar"]}] {${partyStat[memberIndex]["special"]}%} 💫\n`;
                    }
                }
            }

            if (bossStat["attackCounter"] == 1) bossStat["text"] = "Pidgey readys to attack.";

            i.deferUpdate()
            response.edit({ embeds: [makeRaidEmbed(party, partyStat, bossStat)], components: [makeRaidButton()], files: [attachment] });
        })
        
    }
};