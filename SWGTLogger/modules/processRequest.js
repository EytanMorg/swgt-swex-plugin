const pluginName = 'SWGTLogger';
var wizardBattles = [];
var apiReference = {
    messageType: 'OK',
    enabledGuilds: [],
    enabledWizards: []//TODO:Limit entries based on return guild---will need wizardID-Guild Map
};
var wizardBattles = [];

export default {
    processRequest(command, proxy, config, req, resp, cache) {
        //if (command == "HubUserLogin")
        //  if (!config.Config.Plugins[pluginName].sendCharacterJSON) return;

        //Clean HubUserLogin resp
        if (resp['command'] == 'HubUserLogin') {
            var requiredHubUserLoginElements = [
                'command',
                'wizard_info',
                'guild',
                'unit_list',
                'runes',
                'artifacts',
                'deco_list',
                'tvalue',
                'tzone',
                'server_id',
                'server_endpoint'
            ];
            var wizardInfoRequiredElements = [
                'wizard_id',
                'wizard_name'
            ];
            var guildRequiredElements = [
                'guild_info',
                'guild_members'
            ];
            var guildInfoRequiredElements = [
                'guild_id',
                'name'
            ];
            var unitListRequiredElements = [
                'unit_id',
                'wizard_id',
                'unit_master_id',
                'unit_level',
                'class',
                'runes',
                'artifacts',
                'create_time',
                'homunculus',
                'homunculus_name',
                'skills'
            ];
            var decoListRequiredElements = [
                'wizard_id',
                'deco_id',
                'master_id',
                'level'
            ];
            //Map wizardMonsters to wizard battles for server guild war
            try {
                wizardInfo = {}
                wizardFound = false;
                for (var k = wizardBattles.length - 1; k >= 0; k--) {
                    if (wizardBattles[k].wizard_id == resp['wizard_info']['wizard_id']) {
                        wizardBattles[k].sendBattles = [];
                        wizardFound = true;
                        wizardBattles[k].monsterIDMap = {};
                        proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `HubUserLogin:Wizard Found-${wizardFound}-WB:${wizardBattles[k].wizard_id}-Resp:${resp['wizard_info']['wizard_id']}` });
                        for (var mon in resp.unit_list) {
                            wizardBattles[k].monsterIDMap[resp.unit_list[mon].unit_id] = resp.unit_list[mon].unit_master_id;
                        }

                    }
                }
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `HubUserLogin:Wizard Found-${wizardFound}-${resp['wizard_info']['wizard_id']}` });
                if (!wizardFound) {
                    wizardInfo.wizard_id = resp['wizard_info']['wizard_id'];
                    wizardInfo.monsterIDMap = {};
                    for (var mon in resp.unit_list) {
                        wizardInfo.monsterIDMap[resp.unit_list[mon].unit_id] = resp.unit_list[mon].unit_master_id;
                        wizardInfo.sendBattles = [];
                    }
                    wizardBattles.push(wizardInfo);
                }
                sendResp = wizardBattles;
                this.writeToFile(proxy, req, sendResp, '3MDCMonsterMap-');
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Map Monsters ${resp['command']}` });
            } catch (e) {
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `${resp['command']}-Failed Monster Mapping-${e.message}` });
            }
            //Purge all unused variables
            var i = apiReference.enabledGuilds.length;
            while (i--) {
                if (apiReference.enabledGuilds[i] === resp.guild_info.guild_id) {
                    if (!(wizardid in apiReference.enabledWizards)) {
                        apiReference.enabledWizards.push(wizardid)
                    }
                }
            }
            pruned = {}
            for (var i in requiredHubUserLoginElements) {
                //Deep copy so we can modify
                try {
                    pruned[requiredHubUserLoginElements[i]] = JSON.parse(JSON.stringify(resp[requiredHubUserLoginElements[i]]));
                } catch (error) { }
            }
            //Move runes/artifact from monsters to inventory (and detach from monster id)
            for (var mon in pruned.unit_list) {
                for (var rune in pruned.unit_list[mon].runes) {
                    pruned.unit_list[mon].runes[rune].occupied_id = 0;
                    pruned.runes.push(pruned.unit_list[mon].runes[rune])
                    delete pruned.unit_list[mon].runes[rune];
                }
                for (var artifact in pruned.unit_list[mon].artifacts) {
                    pruned.unit_list[mon].artifacts[artifact].occupied_id = 0;
                    pruned.artifacts.push(pruned.unit_list[mon].artifacts[artifact])
                    delete pruned.unit_list[mon].artifacts[artifact];
                }
            }
            //If import monsters is false, remove all monsters
            if (!config.Config.Plugins[pluginName].importMonsters)
                delete pruned['unit_list'];

            resp = pruned
        }

        //update siege battle map packet
        if (resp['command'] == 'GetGuildSiegeMatchupInfo') {
            try {
                //wizard id from request---guild id in member list---guild id
                wizardid = req['wizard_id'];
                packetInfo = {};
                packetInfo.guilds = [];

                blueGuildID = 0;
                bluePosID = 0;
                for (var wizard in resp.wizard_info_list) {
                    if (wizardid == resp.wizard_info_list[wizard].wizard_id) {
                        blueGuildID = resp.wizard_info_list[wizard].guild_id;
                        //apply enabled guild to wizard id if blueGuildID in apiReference.EnabledGuilds
                        var i = apiReference.enabledGuilds.length;
                        while (i--) {
                            if (apiReference.enabledGuilds[i] === blueGuildID) {
                                if (!(wizardid in apiReference.enabledWizards)) {
                                    apiReference.enabledWizards.push(wizardid)
                                }
                            }
                        }
                    }
                }

                yellowPosID = 0;
                redPosID = 0;
                for (var guild in resp.guild_list) {
                    if (blueGuildID == resp.guild_list[guild].guild_id) {
                        bluePosID = resp.guild_list[guild].pos_id;
                        if (bluePosID == 1) {
                            yellowPosID = 2;
                            redPosID = 3;
                        }
                        if (bluePosID == 2) {
                            yellowPosID = 3;
                            redPosID = 1;
                        }
                        if (bluePosID == 3) {
                            yellowPosID = 1;
                            redPosID = 2;
                        }
                    }
                }
                for (var guild in resp.guild_list) {
                    guildInfo = {}
                    guildInfo.guild_id = resp.guild_list[guild].guild_id;
                    guildInfo.pos_id = resp.guild_list[guild].pos_id;
                    if (bluePosID == guildInfo.pos_id)
                        guildInfo.color = "blue";
                    if (yellowPosID == guildInfo.pos_id)
                        guildInfo.color = "yellow";
                    if (redPosID == guildInfo.pos_id)
                        guildInfo.color = "red";
                    towerInfo = [];
                    for (var base in resp.base_list) {
                        if (resp.base_list[base].guild_id == resp.guild_list[guild].guild_id && resp.base_list[base].base_type > 1) {
                            towerInfo.push(resp.base_list[base].base_number);
                        }
                    }
                    guildInfo.towers = towerInfo;
                    packetInfo.guilds.push(guildInfo);
                }
                packetInfo.command = "SiegeBaseColors";
                packetInfo.siege_id = resp.match_info.siege_id;
                packetInfo.match_id = resp.match_info.match_id;
                packetInfo.guild_id = blueGuildID;
                packetInfo.date_time_stamp = resp.tvalue;

                resp2 = packetInfo;
                this.writeToFile(proxy, req, resp2, 'SWGT');
                if (this.hasCacheMatch(proxy, config, req, resp2, cache)) return;
                this.uploadToWebService(proxy, config, req, resp2, 'SWGT');
            } catch (e) {
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `${resp2['command']}-${e.message}` });
            }
        }

        if (resp['command'] == 'GetGuildInfo') {
            var i = apiReference.enabledGuilds.length;
            while (i--) {
                if (apiReference.enabledGuilds[i] === resp.guild.guild_info.guild_id) {
                    if (!(wizardid in apiReference.enabledWizards)) {
                        apiReference.enabledWizards.push(wizardid)
                    }
                }
            }
        }
        if (resp['command'] == 'GetServerGuildWarMatchInfo') {
            var i = apiReference.enabledGuilds.length;
            while (i--) {
                if (apiReference.enabledGuilds[i] === resp.server_guildwar_match_info.guild_id) {
                    if (!(wizardid in apiReference.enabledWizards)) {
                        apiReference.enabledWizards.push(wizardid)
                    }
                }
            }
        }

        //Clean GetServerGuildWarDefenseDeckList resp
        if (resp['command'] == 'GetServerGuildWarDefenseDeckList') {
            try {
                for (var root_element_name in resp) {
                    console.log(root_element_name);
                    if (root_element_name == "deck_list") {
                        var deck_list = resp[root_element_name];
                        for (var deck_list_index in deck_list) {
                            var deck_list_child_element = deck_list[deck_list_index];

                            delete deck_list_child_element.total_win_count;
                            delete deck_list_child_element.total_draw_count;
                            delete deck_list_child_element.total_lose_count;

                            delete deck_list_child_element.win_count;
                            delete deck_list_child_element.draw_count;
                            delete deck_list_child_element.lose_count;
                        }
                    }
                    if (root_element_name == "round_unit_list") {
                        var round_unit_list = resp[root_element_name];

                        for (var round_unit_list_index in round_unit_list) {
                            var round_unit_list_child_element = round_unit_list[round_unit_list_index];

                            for (var round_unit_list_child_element_index in round_unit_list_child_element) {
                                var round_unit_list_child_element_element = round_unit_list_child_element[round_unit_list_child_element_index];

                                delete round_unit_list_child_element_element.unit_info.accuracy;
                                delete round_unit_list_child_element_element.unit_info.artifacts;
                                delete round_unit_list_child_element_element.unit_info.atk;
                                delete round_unit_list_child_element_element.unit_info.attribute;
                                delete round_unit_list_child_element_element.unit_info.awakening_info;
                                delete round_unit_list_child_element_element.unit_info.building_id;
                                delete round_unit_list_child_element_element.unit_info.class;
                                delete round_unit_list_child_element_element.unit_info.con;
                                delete round_unit_list_child_element_element.unit_info.costume_master_id;
                                delete round_unit_list_child_element_element.unit_info.create_time;
                                delete round_unit_list_child_element_element.unit_info.critical_damage;
                                delete round_unit_list_child_element_element.unit_info.critical_rate;
                                delete round_unit_list_child_element_element.unit_info.def;
                                delete round_unit_list_child_element_element.unit_info.exp_gain_rate;
                                delete round_unit_list_child_element_element.unit_info.exp_gained;
                                delete round_unit_list_child_element_element.unit_info.experience;
                                delete round_unit_list_child_element_element.unit_info.homunculus;
                                delete round_unit_list_child_element_element.unit_info.homunculus_name;
                                delete round_unit_list_child_element_element.unit_info.island_id;
                                delete round_unit_list_child_element_element.unit_info.pos_x;
                                delete round_unit_list_child_element_element.unit_info.pos_y;
                                delete round_unit_list_child_element_element.unit_info.resist;
                                delete round_unit_list_child_element_element.unit_info.runes;
                                delete round_unit_list_child_element_element.unit_info.skills;
                                delete round_unit_list_child_element_element.unit_info.source;
                                delete round_unit_list_child_element_element.unit_info.spd;
                                delete round_unit_list_child_element_element.unit_info.trans_items;
                                delete round_unit_list_child_element_element.unit_info.unit_index;
                                delete round_unit_list_child_element_element.unit_info.unit_level;
                            }
                        }
                    }
                }
            } catch (e) { }
        }

        this.writeToFile(proxy, req, resp, 'SWGT');
        if (this.hasCacheMatch(proxy, config, req, resp, cache)) return;
        this.uploadToWebService(proxy, config, req, resp, 'SWGT');
    }
}