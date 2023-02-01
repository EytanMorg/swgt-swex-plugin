const pluginName = 'SWGTLogger';
var wizardBattles = [];
var tempDefenseDeckInfo = [];

export default {
    process3MDCRequest(proxy, config, req, resp) {
        if (!config.Config.Plugins[pluginName].uploadBattles) return false;

        if (resp['command'] == 'GetServerGuildWarMatchInfo') {
            //If wizard id and rating doesn't exist in wizardBattles[] then push to it
            try {
                wizardInfo = {}
                wizardFound = false;
                for (var k = wizardBattles.length - 1; k >= 0; k--) {
                    if (wizardBattles[k].wizard_id == req['wizard_id']) {
                        //update rating id
                        wizardBattles[k].guild_rating_id = resp['server_guildwar_match_info']['match_rating_id'];
                        wizardBattles[k].guild_id = resp['server_guildwar_match_info']['guild_id'];
                        wizardBattles[k].guild_name = resp['server_guildwar_match_info']['guild_name'];
                        wizardBattles[k].opp_guild_name = resp['opp_guild_match_info']['guild_name'];
                        wizardBattles[k].sendBattles = [];
                        wizardFound = true;
                    }
                }
                if (!wizardFound) {
                    wizardInfo.wizard_id = req['wizard_id'];
                    wizardInfo.guild_name = resp['server_guildwar_match_info']['guild_name'];
                    wizardInfo.guild_rating_id = resp['server_guildwar_match_info']['match_rating_id'];
                    wizardInfo.guild_id = resp['server_guildwar_match_info']['guild_id'];
                    wizardInfo.opp_guild_name = resp['opp_guild_match_info']['guild_name'];
                    wizardInfo.sendBattles = [];
                    wizardBattles.push(wizardInfo);
                }

            } catch (e) {
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `${resp['command']}-${e.message}` });
            }
        }
        if (resp['command'] == 'GetGuildSiegeRankingInfo') {
            //If wizard id and rating doesn't exist in wizardBattles[] then push to it
            try {
                wizardInfo = {}
                wizardFound = false;
                for (var k = wizardBattles.length - 1; k >= 0; k--) {
                    if (wizardBattles[k].wizard_id == req['wizard_id']) {
                        //update rating id
                        wizardBattles[k].siege_rating_id = resp['guildsiege_ranking_info']['rating_id'];
                        wizardBattles[k].guild_id = resp['guildsiege_ranking_info']['guild_id'];
                        wizardBattles[k].sendBattles = [];
                        wizardFound = true;
                    }
                }
                if (!wizardFound) {
                    wizardInfo.wizard_id = req['wizard_id'];
                    wizardInfo.siege_rating_id = resp['guildsiege_ranking_info']['rating_id'];
                    wizardInfo.guild_id = resp['guildsiege_ranking_info']['guild_id'];
                    wizardInfo.sendBattles = [];
                    wizardBattles.push(wizardInfo);
                }
            } catch (e) {
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `${resp['command']}-${e.message}` });
            }
        }
        if (resp['command'] == 'GetGuildSiegeMatchupInfo') {
            //If wizard id and rating doesn't exist in wizardBattles[] then push to it
            try {
                wizardInfo = {}
                wizardFound = false;
                for (var k = wizardBattles.length - 1; k >= 0; k--) {
                    if (wizardBattles[k].wizard_id == req['wizard_id']) {
                        wizardBattles[k].siege_rating_id = resp['match_info']['rating_id'];

                        //clear attack and defense lists on new siege matchid for a specific wizard (to allow for multiple guilds being watched by the same plugin)
                        if (wizardBattles[k].match_id != resp['match_info']['match_id']) {
                            wizardBattles[k].observerDefenseInfo = [];
                            wizardBattles[k].observerAttackerList = [];
                        }
                        wizardBattles[k].match_id = resp['match_info']['match_id'];
                        for (var wizard in resp['wizard_info_list']) {
                            if (resp['wizard_info_list'][wizard].wizard_id == req['wizard_id']) {
                                wizardBattles[k].guild_id = resp['wizard_info_list'][wizard].guild_id;
                                //TODO: add opponent guild id object to reference guild names												 
                            }
                        }

                        wizardBattles[k].sendBattles = [];
                        wizardFound = true;
                    }
                }
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `GGSMI:Wizard Found-${wizardFound}` });
                if (!wizardFound) {
                    wizardInfo.wizard_id = req['wizard_id'];
                    wizardInfo.siege_rating_id = resp['match_info']['rating_id'];
                    wizardInfo.match_id = resp['match_info']['match_id'];
                    wizardInfo.observerDefenseInfo = [];
                    wizardInfo.observerAttackerList = [];
                    for (var wizard in resp['wizard_info_list']) {
                        if (resp['wizard_info_list'][wizard].wizard_id == req['wizard_id']) {
                            wizardInfo.guild_id = resp['wizard_info_list'][wizard].guild_id;
                        }
                    }
                    wizardInfo.sendBattles = [];
                    wizardBattles.push(wizardInfo);
                }

                sendResp = wizardBattles;
                this.writeToFile(proxy, req, sendResp, 'WizardBattles-');
            } catch (e) {
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `${resp['command']}-${e.message}` });
            }
        }
        if (resp['command'] == 'BattleServerGuildWarStart' || resp['command'] == 'BattleServerGuildWarStartVirtual') {
            //Store only the information needed for transfer
            try {
                k = 0;
                //match up wizard id and push the battle
                for (var kindex = wizardBattles.length - 1; kindex >= 0; kindex--) {
                    if (wizardBattles[kindex].wizard_id == req['wizard_id']) {
                        //proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Test Server GW Start-Found Index- ${resp['command']}` });
                        k = kindex;
                        kindex = -1;
                    }
                    //if (kindex == -1){break};
                }

                for (var i = 0; i < 5; i++) {
                    battle = {}
                    battle.command = "3MDCBattleLog";
                    battle.battleType = "WorldGuildBattle";
                    battle.wizard_id = resp.wizard_info.wizard_id;
                    battle.wizard_name = resp.wizard_info.wizard_name;
                    battle.battleKey = resp.battle_key;
                    battle.battleIndex = i;
                    battle.battleStartTime = resp.tvalue;
                    battle.defense = {}
                    battle.counter = {}
                    battle.opp_guild_id = resp.target_base_info.guild_id;
                    battle.opp_wizard_id = resp.target_base_info.wizard_id;
                    battle.opp_wizard_name = resp.target_base_info.wizard_name;
                    battle.battleRank = wizardBattles[k].guild_rating_id;
                    battle.guild_id = wizardBattles[k].guild_id;
                    battle.opp_guild_name = wizardBattles[k].opp_guild_name;
                    battle.guild_name = wizardBattles[k].guild_name;

                    //prepare the arrays
                    units = [];
                    battle.defense.units = [];
                    battle.counter.units = [];
                    battle.counter.unique = [];
                    for (var j = 0; j < 3; j++) {
                        try {
                            //Offense Mons
                            //battle.counter.units.push(resp.unit_id_list[i][j].unit_master_id);//need to map unit id from hubuserlogin
                            battle.counter.unique.push(resp.unit_id_list[i][j]); //unique monster id ''
                            //proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `${resp.unit_id_list[i][j]}-Counter List-${i}-${j}-${wizardBattles[k].monsterIDMap?.[resp.unit_id_list[i][j]]}` });
                            if (wizardBattles[k].monsterIDMap?.[resp.unit_id_list[i][j]] !== undefined) {
                                counterUnit = wizardBattles[k].monsterIDMap[resp.unit_id_list[i][j]];
                            } else {
                                counterUnit = -99999;
                            }
                            battle.counter.units.push(counterUnit);
                            //Defense Mons
                            iDefense = (i + 1).toString();
                            battle.defense.units.push(resp.opp_unit_list[iDefense].unit_list[j].unit_info.unit_master_id);
                        } catch (e) {
                            //proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `${resp['command']}-Counter Prep-${e.message}` });	
                        }
                    }

                    wizardBattles[k].sendBattles.push(battle);
                    //sendResp = battle;
                    //this.writeToFile(proxy, req, sendResp,'3MDCServerGWStart-'+i);
                    //proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Test Server GW Start ${resp['command']}` });


                }
            } catch (e) {
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `${resp['command']}-${e.message}` });
            }
        }
        if (resp['command'] == 'BattleGuildSiegeStart_v2') {
            try {
                battle = {}
                battle.command = "3MDCBattleLog";
                battle.battleType = "Siege";
                battle.wizard_id = resp.wizard_info.wizard_id;
                battle.wizard_name = resp.wizard_info.wizard_name;
                battle.battleKey = resp.battle_key;
                battle.battleStartTime = resp.tvalue;
                battle.defense = {}
                battle.counter = {}
                //TODO: add opp guild id/guild name, opp_id and opp_name---from prebuilt objects on siegebasedefenseunitlist and matchupinfo
                //prepare the arrays
                units = [];
                battle.defense.units = [];
                battle.counter.units = [];
                battle.counter.unique = [];
                for (var j = 0; j < 3; j++) {
                    try {
                        //Defense Mons
                        battle.defense.units.push(resp.guildsiege_opp_unit_list[j].unit_info.unit_master_id);
                        //Offense Mons
                        battle.counter.units.push(resp.guildsiege_my_unit_list[j].unit_master_id);
                        battle.counter.unique.push(resp.guildsiege_my_unit_list[j].unit_id);

                    } catch (e) { }
                }
                //match up wizard id and push the battle
                for (var k = wizardBattles.length - 1; k >= 0; k--) {
                    if (wizardBattles[k].wizard_id == req['wizard_id']) {
                        //store battle in array
                        battle.battleRank = wizardBattles[k].siege_rating_id;
                        battle.guild_id = wizardBattles[k].guild_id;
                        wizardBattles[k].sendBattles.push(battle);
                    }
                }
            } catch (e) {
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `${resp['command']}-${e.message}` });
            }
        }
        if (resp['command'] == 'BattleServerGuildWarRoundResult') {
            //store battle start time for second battle and end time for first battle
            var j = req['round_id'] - 1;
            try {//Handle out of order processing
                for (var wizard in wizardBattles) {
                    //proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Server GW Battle Round Wizard Search ${wizard}` });
                    for (var k = wizardBattles[wizard].sendBattles.length - 1; k >= 0; k--) {
                        if (wizardBattles[wizard].sendBattles[k].wizard_id == req['wizard_id']) {
                            //if (j==1){wizardBattles[wizard].sendBattles[k].battleStartTime = resp.tvalue};
                            if (j == k) {
                                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Server GW Battle Round ${j + 1} Saved` });
                                wizardBattles[wizard].sendBattles[k].battleDateTime = resp.tvalue;

                                //sendResp = wizardBattles[wizard].sendBattles[k];

                                if (j < 4) { wizardBattles[wizard].sendBattles[k + 1].battleStartTime = resp.tvalue };

                                //if (sendResp.defense.units.length == 3 && sendResp.counter.units.length > 0 && sendResp.battleRank >= 1000) {
                                //this.writeToFile(proxy, req, sendResp,'3MDCProgress-'+j);
                                //}
                            }
                        }
                    }
                }
                //proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Server GW Battle Round End Test ${j}` });
            } catch (e) {
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Server GW Battle Round End Error ${e.message}` });
            }
            if (j == 1) {
                j = 0;
            }
        }

        if (req['command'] == 'BattleGuildSiegeResult') {
            var j = 0;
            try {//Handle out of order processing
                for (var wizard in wizardBattles) {
                    for (var k = wizardBattles[wizard].sendBattles.length - 1; k >= 0; k--) {
                        //Handle multiple accounts with GW and Siege going at the same time. match battlekey and wizard. then do battles 1 and 2 and delete from the mon list.
                        if (wizardBattles[wizard].sendBattles[k].battleKey == req['battle_key']) {
                            wizardBattles[wizard].sendBattles[k].win_lose = req['win_lose'];
                            wizardBattles[wizard].sendBattles[k].battleDateTime = resp.tvalue - j;
                            wizardBattles[wizard].sendBattles[k].swex_server_id = resp['server_id'];
                            j++;
                            sendResp = wizardBattles[wizard].sendBattles[k];
                            //remove battle from the sendBattlesList
                            wizardBattles[wizard].sendBattles.splice(k, 1);
                            //if 3 mons in offense and defense then send to webservice
                            if (sendResp.defense.units.length == 3 && sendResp.counter.units.length > 0 && sendResp.battleRank >= 4000) {
                                this.writeToFile(proxy, req, sendResp, '3MDC-' + k);

                                this.uploadToWebService(proxy, config, req, sendResp, '3MDC');
                                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Siege Battle End Processed ${k}` });
                            }
                        }
                    }
                }
            } catch (e) {
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Siege Battle End Error ${e.message}` });
            }
            if (j == 1) {
                j = 0;
            }
        }
        if (req['command'] == 'BattleServerGuildWarResult' || resp['command'] == 'BattleServerGuildWarResultVirtual') {
            var j = 5;
            try {//Handle out of order processing
                for (var wizard in wizardBattles) {

                    for (var k = wizardBattles[wizard].sendBattles.length - 1; k >= 0; k--) {
                        //proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Server GW Battle End Loop ${k} ${req['win_lose_list'][j]}` });
                        if (wizardBattles[wizard].sendBattles[k].wizard_id == req['wizard_id']) {


                            jstr = j.toString();
                            wizardBattles[wizard].sendBattles[k].win_lose = req['win_lose_list'][jstr];
                            wizardBattles[wizard].sendBattles[k].attacker_server_id = resp['attack_info']['server_id'];
                            wizardBattles[wizard].sendBattles[k].opp_server_id = resp['target_base_info']['server_id'];
                            wizardBattles[wizard].sendBattles[k].swex_server_id = resp['server_id'];
                            if (j == 5) { wizardBattles[wizard].sendBattles[k].battleDateTime = resp.tvalue };
                            j--;
                            sendResp = wizardBattles[wizard].sendBattles[k];
                            //remove battle from the sendBattlesList
                            wizardBattles[wizard].sendBattles.splice(k, 1);
                            //if result then add time and win/loss then send to webservice
                            this.writeToFile(proxy, req, sendResp, '3MDC-' + k);
                            if (sendResp.defense.units.length == 3 && sendResp.counter.units.length > 0 && sendResp.battleRank >= 1000) {
                                this.uploadToWebService(proxy, config, req, sendResp, '3MDC');
                                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Server GW Battle Round End Processed ${k + 1}` });
                            }
                        }
                        //proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Server GW Battle End Test ${k}` });
                    }
                }
                //proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Server GW Battle End Test 2` });

            } catch (e) {
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Server GW Battle End Error ${e.message}` });
            }
            if (j == 1) {
                j = 0;
            }
        }

        if (req['command'] == 'SetGuildSiegeBattleReplayData') {
            //If wizard id and rating doesn't exist in wizardBattles[] then push to it
            try {
                wizardInfo = {}
                wizardFound = false;
                for (var k = wizardBattles.length - 1; k >= 0; k--) {
                    if (wizardBattles[k].wizard_id == req['wizard_id']) {
                        wizardBattles[k].sendBattles = [];
                        wizardFound = true;
                    }
                }
                if (!wizardFound) {
                    wizardInfo.wizard_id = resp.replay_info.wizard_id;
                    wizardInfo.sendBattles = [];
                    wizardBattles.push(wizardInfo);
                }
            } catch (e) {
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `${resp['command']}-${e.message}` });
            }
            try {
                if (resp.replay_info.guild_id == resp.replay_info.opp_guild_id) {
                    battle = {}
                    battle.command = "3MDCBattleLog";
                    battle.battleType = "SiegeTest";
                    battle.wizard_id = resp.replay_info.wizard_id;
                    battle.wizard_name = resp.replay_info.wizard_name;
                    battle.battleKey = resp.replay_info.battle_key;
                    battle.guild_id = resp.replay_info.guild_id;
                    battle.opp_wizard_id = resp.replay_info.opp_wizard_id;
                    battle.opp_wizard_name = resp.replay_info.opp_wizard_name;
                    battle.battleRank = 4001;
                    battle.defense = {}
                    battle.counter = {}

                    //prepare the arrays
                    units = [];
                    battle.defense.units = [];
                    battle.counter.units = [];
                    battle.counter.unique = [];
                    for (var j = 0; j < 3; j++) {
                        try {

                            //Defense Mons
                            battle.defense.units.push(resp.replay_info.opp_unit_info[j][2]);
                            //Offense Mons
                            battle.counter.units.push(resp.replay_info.unit_info[j][2]);
                            battle.counter.unique.push(resp.replay_info.unit_info[j][1]);
                        } catch (e) { }
                    }
                    //match up wizard id and push the battle
                    for (var k = wizardBattles.length - 1; k >= 0; k--) {
                        if (wizardBattles[k].wizard_id == req['wizard_id']) {
                            battle.battleRank = wizardBattles[k].siege_rating_id;
                            wizardBattles[k].sendBattles.push(battle);
                            proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Wizard Battle ${req['wizard_id']}: ${k}-${resp['command']}` });
                        }
                    }
                }
            } catch (e) {
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `${resp['command']}-${e.message}` });
            }

            //send the request like the siege result to the server
            var j = 0;
            try {
                for (var wizard in wizardBattles) {
                    for (var k = wizardBattles[wizard].sendBattles.length - 1; k >= 0; k--) {
                        //TODO: Handle multiple accounts with GW and Siege going at the same time. match battlekey and wizard. then do battles 1 and 2 and delete from the mon list.
                        if (wizardBattles[wizard].sendBattles[k].battleKey == resp.replay_info.battle_key) {
                            proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Wizard ${wizard} Battle Key ${resp.replay_info.battle_key}: ${j}-${resp['command']}` });

                            wizardBattles[wizard].sendBattles[k].win_lose = resp.replay_info.win_lose;
                            wizardBattles[wizard].sendBattles[k].battleDateTime = resp.tvalue - j;
                            j++;
                            sendResp = wizardBattles[wizard].sendBattles[k];
                            //remove battle from the sendBattlesList
                            wizardBattles[wizard].sendBattles.splice(k, 1);
                            //if 3 mons in offense and defense then send to webservice
                            if (sendResp.defense.units.length == 3 && sendResp.counter.units.length > 0) {
                                this.writeToFile(proxy, req, sendResp, '3MDC-' + k);

                                this.uploadToWebService(proxy, config, req, sendResp, '3MDC');
                                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Siege Test Battle Processed ${k}` });
                            }
                        }
                    }
                }
            } catch (e) {
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Siege Test Battle Error ${e.message}` });
            }
            if (j == 1) {
                j = 0;
            }
        }

        //Perform the observer role to create a battle log
        //Step 1 - Create a list of defense units for the base selected
        //Step 2 - Add an attacking unit to an attacker array for that base and defense
        //Step 3 - View the battle log and match up based on the time of entry and the time of battle log, once matched send the resulting wizardBattle
        //Populate the Defense_Deck Table
        if (resp['command'] == 'GetGuildSiegeBaseDefenseUnitList') {
            //If wizard id and rating doesn't exist in wizardBattles[] then push to it
            try {
                var wizardIndex = 0; //match wizardID
                for (var k = wizardBattles.length - 1; k >= 0; k--) {
                    if (wizardBattles[k].wizard_id == req['wizard_id']) {
                        wizardIndex = k;
                    }
                }
                defenseInfo = {}
                tempDefenseDeckInfo = [];
                sendDecks = {}


                for (var deck in resp['defense_deck_list']) {
                    defenseInfo = {};
                    defenseFound = false;
                    defenseInfo.wizard_id = resp['defense_deck_list'][deck].wizard_id;
                    defenseInfo.deck_id = resp['defense_deck_list'][deck].deck_id;
                    defenseInfo.base_id = req.base_number;
                    unitCount = 0;
                    for (var defenseUnit in resp['defense_unit_list']) {
                        if (defenseInfo.deck_id == resp['defense_unit_list'][defenseUnit].deck_id && resp['defense_unit_list'][defenseUnit].pos_id == 1 && resp['defense_unit_list'][defenseUnit].hasOwnProperty('unit_info')) {
                            defenseInfo.uniqueMon1 = resp['defense_unit_list'][defenseUnit].unit_info.unit_id;
                            defenseInfo.mon1 = resp['defense_unit_list'][defenseUnit].unit_info.unit_master_id;
                            unitCount++;
                        }
                        if (defenseInfo.deck_id == resp['defense_unit_list'][defenseUnit].deck_id && resp['defense_unit_list'][defenseUnit].pos_id == 2 && resp['defense_unit_list'][defenseUnit].hasOwnProperty('unit_info')) {
                            defenseInfo.uniqueMon2 = resp['defense_unit_list'][defenseUnit].unit_info.unit_id;
                            defenseInfo.mon2 = resp['defense_unit_list'][defenseUnit].unit_info.unit_master_id;
                            unitCount++;
                        }
                        if (defenseInfo.deck_id == resp['defense_unit_list'][defenseUnit].deck_id && resp['defense_unit_list'][defenseUnit].pos_id == 3 && resp['defense_unit_list'][defenseUnit].hasOwnProperty('unit_info')) {
                            defenseInfo.uniqueMon3 = resp['defense_unit_list'][defenseUnit].unit_info.unit_id;
                            defenseInfo.mon3 = resp['defense_unit_list'][defenseUnit].unit_info.unit_master_id;
                            unitCount++;
                        }
                    }
                    //sort mon2 and mon3
                    if (unitCount == 3) {
                        if (defenseInfo.mon3 < defenseInfo.mon2) {
                            tempMon = defenseInfo.uniqueMon2;
                            tempMon2 = defenseInfo.mon2;
                            defenseInfo.uniqueMon2 = defenseInfo.uniqueMon3;
                            defenseInfo.mon2 = defenseInfo.mon3;
                            defenseInfo.uniqueMon3 = tempMon;
                            defenseInfo.mon3 = tempMon2;

                        }
                        defenseInfo.deckPrimaryKey = defenseInfo.wizard_id.toString() + "_" + defenseInfo.uniqueMon1.toString() + "_" + defenseInfo.uniqueMon2.toString() + "_" + defenseInfo.uniqueMon3.toString();
                        //add attackunit and latest battlestarttime to the defenseInfo
                        for (var defenseUnitStatus in resp['defense_deck_status_list']) {
                            if (defenseInfo.deck_id == resp['defense_deck_status_list'][defenseUnitStatus].deck_id) {
                                defenseInfo.attack_wizard_id = resp['defense_deck_status_list'][defenseUnitStatus].attack_wizard_id;
                                defenseInfo.battle_start_time = resp['defense_deck_status_list'][defenseUnitStatus].battle_start_time;
                            }
                        }
                        //check if defense exists first
                        for (var k = wizardBattles[wizardIndex].observerDefenseInfo.length - 1; k >= 0; k--) {
                            if (wizardBattles[wizardIndex].observerDefenseInfo[k].deck_id == defenseInfo.deck_id &&
                                wizardBattles[wizardIndex].observerDefenseInfo[k].attack_wizard_id == defenseInfo.attack_wizard_id &&
                                wizardBattles[wizardIndex].observerDefenseInfo[k].battle_start_time == defenseInfo.battle_start_time) {
                                //observerDefenseInfo.push(defenseInfo) 
                                defenseFound = true;
                            }
                        }
                        if (defenseFound == false) {
                            wizardBattles[wizardIndex].observerDefenseInfo.push(defenseInfo)
                        }
                    }
                }
                sendDecks.command = "SWGTSiegeObserverDefense";
                sendDecks.deck_units = wizardBattles[wizardIndex].observerDefenseInfo;
                sendResp = sendDecks;
            } catch (e) {
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `${resp['command']}-${e.message}` });
            }
        }

        //Step 2
        if (resp['command'] == 'GetGuildSiegeAttackUnitListInBattle') {
            //If wizard id and rating doesn't exist in wizardBattles[] then push to it
            try {
                var wizardIndex = 0; //match wizardID
                for (var k = wizardBattles.length - 1; k >= 0; k--) {
                    if (wizardBattles[k].wizard_id == req['wizard_id']) {
                        wizardIndex = k;
                    }
                }
                attackInfo = {}
                tempDefenseDeckInfo = [];
                sendDecks = {}


                for (var deck in resp['guildsiege_attack_unit_list']) {
                    attackInfo = {};
                    attackFound = false;
                    attackInfo.attack_wizard_id = resp['guildsiege_attack_unit_list'][deck].wizard_id;
                    attackInfo.attack_wizard_name = resp['wizard_info_list'][0].wizard_name;
                    attackInfo.deck_id = req.deck_id;
                    attackInfo.base_id = req.base_number;
                    unitCount = 0;
                    for (var attackUnit in resp['guildsiege_attack_unit_list'][deck].unit_list) {

                        if (resp['guildsiege_attack_unit_list'][deck].unit_list[attackUnit].pos_id == 1) {
                            attackInfo.uniqueMon1 = resp['guildsiege_attack_unit_list'][deck].unit_list[attackUnit].unit_id;
                            attackInfo.mon1 = resp['guildsiege_attack_unit_list'][deck].unit_list[attackUnit].unit_master_id;
                            unitCount++;

                        }
                        if (resp['guildsiege_attack_unit_list'][deck].unit_list[attackUnit].pos_id == 2) {
                            attackInfo.uniqueMon2 = resp['guildsiege_attack_unit_list'][deck].unit_list[attackUnit].unit_id;
                            attackInfo.mon2 = resp['guildsiege_attack_unit_list'][deck].unit_list[attackUnit].unit_master_id;
                            unitCount++;
                        }
                        if (resp['guildsiege_attack_unit_list'][deck].unit_list[attackUnit].pos_id == 3) {
                            attackInfo.uniqueMon3 = resp['guildsiege_attack_unit_list'][deck].unit_list[attackUnit].unit_id;
                            attackInfo.mon3 = resp['guildsiege_attack_unit_list'][deck].unit_list[attackUnit].unit_master_id;
                            unitCount++;
                        }
                    }
                    //sort mon2 and mon3
                    if (unitCount == 3) {
                        if (attackInfo.mon3 < attackInfo.mon2) {
                            tempMon = attackInfo.uniqueMon2;
                            tempMon2 = attackInfo.mon2;
                            attackInfo.uniqueMon2 = attackInfo.uniqueMon3;
                            attackInfo.mon2 = attackInfo.mon3;
                            attackInfo.uniqueMon3 = tempMon;
                            attackInfo.mon3 = tempMon2;

                        }
                        attackInfo.deckPrimaryKey = attackInfo.attack_wizard_id.toString() + "_" + attackInfo.uniqueMon1.toString() + "_" + attackInfo.uniqueMon2.toString() + "_" + attackInfo.uniqueMon3.toString();
                        //add attackunit and latest battlestarttime to the attackInfo
                        attackInfo.battle_start_time = resp.tvalue;

                        //check if defense exists first
                        for (var k = wizardBattles[wizardIndex].observerAttackerList.length - 1; k >= 0; k--) {
                            if (wizardBattles[wizardIndex].observerAttackerList[k].deck_id == attackInfo.deck_id &&
                                wizardBattles[wizardIndex].observerAttackerList[k].attack_wizard_id == attackInfo.attack_wizard_id &&
                                wizardBattles[wizardIndex].observerAttackerList[k].deckPrimaryKey == attackInfo.deckPrimaryKey) {
                                //observerDefenseInfo.push(defenseInfo) 
                                attackFound = true;
                            }
                        }
                        if (attackFound == false) {
                            wizardBattles[wizardIndex].observerAttackerList.push(attackInfo)
                        }
                    }
                }
                sendDecks.command = "SWGTSiegeObserverAttack";
                sendDecks.deck_units = wizardBattles[wizardIndex].observerAttackerList;
                sendResp = sendDecks;
            } catch (e) {
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `${resp['command']}-${e.message}` });
            }
        }

        //Step 3--Review Attacker Battle log and remove defense//attack pairs....could be multiple attackers per one defense so clear all attacks before removing a defense from the list or just on defense loss.
        if (req['command'] == 'GetGuildSiegeBattleLog' && resp['log_type'] == 1) {
            try {
                var wizardIndex = 0; //match wizardID
                for (var k = wizardBattles.length - 1; k >= 0; k--) {
                    if (wizardBattles[k].wizard_id == req['wizard_id']) {
                        wizardIndex = k;
                    }
                }
                for (var battle1 = resp['log_list'][0].battle_log_list.length - 1; battle1 >= 0; battle1--) {  //go through each recorded offense
                    //first see if you can find a defense that matches by base number
                    for (var k = wizardBattles[wizardIndex].observerDefenseInfo.length - 1; k >= 0; k--) {
                        if (resp['log_list'][0].battle_log_list[battle1].base_number == wizardBattles[wizardIndex].observerDefenseInfo[k].base_id &&
                            resp['log_list'][0].battle_log_list[battle1].opp_wizard_id == wizardBattles[wizardIndex].observerDefenseInfo[k].wizard_id) {
                            //once a defense is found, search the attacker list to find any matches for this base, and attack log
                            var defenseDefeated = false;
                            for (var j = wizardBattles[wizardIndex].observerAttackerList.length - 1; j >= 0; j--) {

                                if (resp['log_list'][0].battle_log_list[battle1].wizard_id == wizardBattles[wizardIndex].observerAttackerList[j].attack_wizard_id &&
                                    wizardBattles[wizardIndex].observerAttackerList[j].deck_id == wizardBattles[wizardIndex].observerDefenseInfo[k].deck_id &&
                                    wizardBattles[wizardIndex].observerDefenseInfo[k].battle_start_time < wizardBattles[wizardIndex].observerAttackerList[j].battle_start_time &&
                                    wizardBattles[wizardIndex].observerAttackerList[j].battle_start_time < resp['log_list'][0].battle_log_list[battle1].log_timestamp) {
                                    battle = {}
                                    battle.command = "3MDCBattleLog";
                                    battle.battleType = "SiegeObserver";
                                    battle.wizard_id = wizardBattles[wizardIndex].observerAttackerList[j].attack_wizard_id;
                                    battle.wizard_name = wizardBattles[wizardIndex].observerAttackerList[j].attack_wizard_name;
                                    battle.defense = {}
                                    battle.counter = {}

                                    //prepare the arrays
                                    units = [];
                                    battle.defense.units = [];
                                    battle.counter.units = [];
                                    battle.counter.unique = [];
                                    //for (var m = 0; m < 3; m++) {
                                    try {


                                        //Defense Mons
                                        battle.defense.units.push(wizardBattles[wizardIndex].observerDefenseInfo[k].mon1);
                                        battle.defense.units.push(wizardBattles[wizardIndex].observerDefenseInfo[k].mon2);
                                        battle.defense.units.push(wizardBattles[wizardIndex].observerDefenseInfo[k].mon3);

                                        //Offense Mons
                                        battle.counter.units.push(wizardBattles[wizardIndex].observerAttackerList[j].mon1);
                                        battle.counter.units.push(wizardBattles[wizardIndex].observerAttackerList[j].mon2);
                                        battle.counter.units.push(wizardBattles[wizardIndex].observerAttackerList[j].mon3);

                                        battle.counter.unique.push(wizardBattles[wizardIndex].observerAttackerList[j].uniqueMon1);
                                        battle.counter.unique.push(wizardBattles[wizardIndex].observerAttackerList[j].uniqueMon2);
                                        battle.counter.unique.push(wizardBattles[wizardIndex].observerAttackerList[j].uniqueMon3);
                                    } catch (e) { }
                                    //}
                                    //match up wizard id for guild rank
                                    for (var m = wizardBattles.length - 1; m >= 0; m--) {
                                        if (wizardBattles[m].wizard_id == req['wizard_id']) {
                                            //store battle in array
                                            battle.battleRank = wizardBattles[m].siege_rating_id;
                                            battle.guild_id = wizardBattles[m].guild_id;
                                        }
                                    }
                                    //win/loss info and then send the battle and remove from the attack list
                                    battle.win_lose = resp['log_list'][0].battle_log_list[battle1].win_lose;
                                    if (battle.win_lose == 1) {
                                        defenseDefeated = true;
                                    }
                                    battle.battleDateTime = resp['log_list'][0].battle_log_list[battle1].log_timestamp;
                                    battle.battleKey = Number(battle.wizard_id.toString() + battle.battleDateTime.toString());
                                    sendResp = battle;
                                    if (sendResp.defense.units.length == 3 && sendResp.counter.units.length > 0 && sendResp.battleRank >= 0) {
                                        req['command'] = "SiegeObserverBattle";
                                        this.writeToFile(proxy, req, sendResp, '3MDC-Obs3-' + j + '-' + k + '-');
                                        this.uploadToWebService(proxy, config, req, sendResp, '3MDC');
                                        proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Siege Observer End Processed ${wizardBattles[wizardIndex].observerAttackerList[j].attack_wizard_name}` });
                                    }
                                    wizardBattles[wizardIndex].observerAttackerList.splice(j, 1);
                                }
                            } //end attacker loop check
                            //if one of the attackers defeated the defense then remove this defense from the observerdefense array
                            if (defenseDefeated) {
                                wizardBattles[wizardIndex].observerDefenseInfo.splice(k, 1);
                            }
                        } //end defense if statement
                    } //end defense loop
                }//end loop through battle log attacks
            } catch (e) {
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Siege Battle End Error ${e.message}` });
            }
        }

    }
}