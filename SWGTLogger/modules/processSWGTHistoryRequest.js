var wizardBattles = [];

export default {
    processSWGTHistoryRequest(command, proxy, config, req, resp, cache) {
        //Populate the Defense_Deck Table
        if (resp['command'] == 'GetGuildSiegeBaseDefenseUnitList' || resp['command'] == 'GetGuildSiegeBaseDefenseUnitListPreset' || resp['command'] == 'GetGuildSiegeDefenseDeckByWizardId') {
            //If wizard id and rating doesn't exist in wizardBattles[] then push to it
            try {
                defenseInfo = {}
                tempDefenseDeckInfo = [];
                sendDecks = {}
                defenseFound = false;

                for (var deck in resp['defense_deck_list']) {
                    defenseInfo = {};
                    defenseInfo.wizard_id = resp['defense_deck_list'][deck].wizard_id;
                    defenseInfo.deck_id = resp['defense_deck_list'][deck].deck_id;
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

                        tempDefenseDeckInfo.push(defenseInfo)
                    }
                }
                sendDecks.command = "SWGTSiegeDeckUnits";
                sendDecks.deck_units = tempDefenseDeckInfo;
                sendResp = sendDecks;
                this.writeToFile(proxy, req, sendResp, 'SWGT2-');
                if (this.hasCacheMatch(proxy, config, req, sendResp, cache)) return;
                this.uploadToWebService(proxy, config, req, sendResp, 'SWGT');
            } catch (e) {
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `${resp['command']}-${e.message}` });
            }
        }

        //Populate the Defense_Deck Log Matching Table

        if (resp['command'] == 'GetGuildSiegeBattleLogByDeckId') {
            //If wizard id and rating doesn't exist in wizardBattles[] then push to it

            try {
                targetdeckid = req['target_deck_id'];
                sendDecks = {}
                deckLogLink = []
                deckwizardID = 0;

                //find the deckid info that matches in the tempDefenseDeckInfo
                for (var k = tempDefenseDeckInfo.length - 1; k >= 0; k--) {
                    if (tempDefenseDeckInfo[k].deck_id == req['target_deck_id']) {
                        deckIDPrimaryKey = tempDefenseDeckInfo[k].wizard_id.toString() + "_" + tempDefenseDeckInfo[k].uniqueMon1.toString() + "_" + tempDefenseDeckInfo[k].uniqueMon2.toString() + "_" + tempDefenseDeckInfo[k].uniqueMon3.toString();
                        deckwizardID = tempDefenseDeckInfo[k].wizard_id;
                    }
                }
                for (var siegewar in resp['log_list']) {
                    for (var battleLog in resp['log_list'][siegewar].battle_log_list) {
                        //add each battle to deckLogLink
                        if (deckwizardID == resp['log_list'][siegewar].battle_log_list[battleLog].wizard_id) {
                            deckLogValues = {}
                            deckLogValues.deckIDPrimaryKey = deckIDPrimaryKey;
                            deckLogValues.wizard_id = resp['log_list'][siegewar].battle_log_list[battleLog].wizard_id;
                            deckLogValues.wizard_name = resp['log_list'][siegewar].battle_log_list[battleLog].wizard_name;
                            deckLogValues.opp_wizard_id = resp['log_list'][siegewar].battle_log_list[battleLog].opp_wizard_id;
                            deckLogValues.opp_wizard_name = resp['log_list'][siegewar].battle_log_list[battleLog].opp_wizard_name;
                            deckLogValues.win_lose = resp['log_list'][siegewar].battle_log_list[battleLog].win_lose;
                            deckLogValues.log_type = resp['log_list'][siegewar].battle_log_list[battleLog].log_type;
                            deckLogValues.log_timestamp = resp['log_list'][siegewar].battle_log_list[battleLog].log_timestamp;
                            deckLogValues.linkPrimaryKey = deckLogValues.wizard_id + "_" + deckLogValues.opp_wizard_id + "_" + deckLogValues.log_timestamp
                            deckLogLink.push(deckLogValues)
                        }
                    }
                }
                sendDecks.command = "SWGTSiegeDeckHistoryLink";
                sendDecks.deck_log_history = deckLogLink;
                sendResp = sendDecks;
                this.writeToFile(proxy, req, sendResp, 'SWGT3-');
                if (this.hasCacheMatch(proxy, config, req, sendResp, cache)) return;
                this.uploadToWebService(proxy, config, req, sendResp, 'SWGT');
            } catch (e) {
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `${resp['command']}-${e.message}` });
            }
        }
    }
}