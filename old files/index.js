const request = require('request');
const fs = require('fs');
const path = require('path');
const pluginName = 'SWGTLogger';
const pluginVersion = '2023-01-08_0719';
var wizardBattles = [];
var tempDefenseDeckInfo = [];
var localAPIkey = '';
var apiReference = {
    messageType: 'OK',
    enabledGuilds: [],
    enabledWizards: []//TODO:Limit entries based on return guild---will need wizardID-Guild Map
};
module.exports = {
    defaultConfig: {
        enabled: true,
        saveToFile: false,
        sendCharacterJSON: true,
        importMonsters: true,
        uploadBattles: false,
        apiKey: '',
        siteURL: ''
    },
    defaultConfigDetails: {
        saveToFile: { label: 'Save to file as well?' },
        sendCharacterJSON: { label: 'Send Character JSON?' },
        importMonsters: { label: 'Import monsters?' },
        uploadBattles: { label: '3MDC upload defense and counter as you battle?' },
        apiKey: { label: 'SWGT API key (On your SWGT profile page)', type: 'input' },
        siteURL: { label: 'SWGT API URL  (On your SWGT profile page)', type: 'input' }
    },
    pluginName,
    pluginDescription:
        `For SWGT Patreon subscribers to automatically upload various Summoners War data. 
    Enable Character JSON to automatically update your guild's members and your player's units/runes/artifacts.
    Enable battle uploading to automatically log defenses and counters`,
    init(proxy, config) {
        cache = {};
        cacheDuration = {};
        cacheTimerSettings = [
            { command: 'GetGuildInfo', timer: 60000 },
            { command: 'GetGuildWarRanking', timer: 300000 },
            { command: 'GetGuildWarMatchLog', timer: 60000 },
            { command: 'GetGuildSiegeMatchupInfo', timer: 60000 },
            { command: 'GetGuildSiegeRankingInfo', timer: 300000 },
            { command: 'GetGuildMazeStatusInfo', timer: 300000 },
            { command: 'getGuildBossBattleInfo', timer: 300000 }
        ];

        var listenToSWGTCommands = [
            //Character JSON and Guild Member List
            'HubUserLogin',

            //Guild Info
            'getGuildAttendInfo',
            'GetGuildInfo',
            'GetGuildInfoByName',
            'GetGuildInfoForChat',
            'GetGuildDataAll',

            //Siege
            'GetGuildSiegeBattleLogByWizardId',
            'GetGuildSiegeBattleLog',
            'GetGuildSiegeMatchupInfo',
            'GetGuildSiegeMatchupInfoForFinished',
            'GetGuildSiegeBaseDefenseUnitList',
            'GetGuildSiegeBaseDefenseUnitListPreset',
            'GetGuildSiegeRankingInfo',

            //Labyrinth
            'GetGuildMazeStatusInfo',
            'GetGuildMazeRankingList',
            'GetGuildMazeContributeList',
            'GetGuildMazeBattleLogByWizard',
            'GetGuildMazeBattleLogByTile',

            //World Guild Battle (Server Guild War)
            'GetServerGuildWarBattleLogByGuild',
            'GetServerGuildWarMatchLog',
            'GetServerGuildWarMatchInfo',
            'GetServerGuildWarRanking',
            'GetServerGuildWarBattleLogByWizard',
            'GetServerGuildWarDefenseDeckList',
            //'GetServerGuildWarBaseDeckList',
            //'GetServerGuildWarBaseInfoListForOppView',
            //'GetServerGuildWarContributeList',

            //Monster Subjugation
            'getGuildBossBattleInfo',
            'getGuildBossBattleLogByWizard',
            'getGuildBossContributeList',
            'getGuildBossRankingList'
        ];

        var listenTo3MDCCommands = [
            //World Guild Battle (Server Guild War)
            'GetServerGuildWarMatchInfo',
            'GetServerGuildWarBaseDeckList',
            'BattleServerGuildWarStart',
            'BattleServerGuildWarRoundResult',
            'BattleServerGuildWarResult',
            'BattleServerGuildWarStartVirtual',
            'BattleServerGuildWarResultVirtual',

            //Siege
            'BattleGuildSiegeStart_v2',
            'BattleGuildSiegeResult',
            'GetGuildSiegeMatchupInfo',

            //TestingSiegeReplays
            'GetGuildSiegeRankingInfo',//rating_id
            'SetGuildSiegeBattleReplayData',

            //AttackViewerInstance
            'GetGuildSiegeBaseDefenseUnitList',
            'GetGuildSiegeAttackUnitListInBattle',
            'GetGuildSiegeBattleLog'
        ];

        var listenToSWGTHistoryCommands = [
            //Siege Defense Units
            'GetGuildSiegeBaseDefenseUnitList',
            'GetGuildSiegeBaseDefenseUnitListPreset',
            'GetGuildSiegeDefenseDeckByWizardId',

            //Defense Log Link
            'GetGuildSiegeBattleLogByDeckId'
        ];


        proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: "Listening to commands: " + listenToSWGTCommands.toString().replace(/,/g, ', ') + '<br><br>' + listenTo3MDCCommands.toString().replace(/,/g, ', ') });
        //Attach SWGT events
        for (var commandIndex in listenToSWGTCommands) {
            var command = listenToSWGTCommands[commandIndex];
            proxy.on(command, (req, resp) => {
                var gRespCopy = JSON.parse(JSON.stringify(resp)); //Deep copy
                gRespCopy.swgtGuildPluginVersion = pluginVersion;
                this.processRequest(command, proxy, config, req, gRespCopy, cache);
            });
        }
        //Attach 3MDC events if enabled
        if (config.Config.Plugins[pluginName].uploadBattles) {
            for (var commandIndex in listenTo3MDCCommands) {
                var command = listenTo3MDCCommands[commandIndex];
                proxy.on(command, (req, resp) => {
                    var gRespCopy = JSON.parse(JSON.stringify(resp)); //Deep copy
                    gRespCopy.swgtGuildPluginVersion = pluginVersion;
                    this.process3MDCRequest(command, proxy, config, req, gRespCopy, cache);
                });
            }
        }

        //Attach SWGT Siege Log History Data
        if (config.Config.Plugins[pluginName].enabled) {
            for (var commandIndex in listenToSWGTHistoryCommands) {
                var command = listenToSWGTHistoryCommands[commandIndex];
                proxy.on(command, (req, resp) => {
                    var gRespCopy = JSON.parse(JSON.stringify(resp)); //Deep copy
                    gRespCopy.swgtGuildPluginVersion = pluginVersion;
                    this.processSWGTHistoryRequest(command, proxy, config, req, gRespCopy, cache);
                });
            }
        }

        //Confirm SWGT plugin version and Site API Settings
        this.checkVersion(proxy);
        this.checkSiteAPI(proxy, config);
    }
};