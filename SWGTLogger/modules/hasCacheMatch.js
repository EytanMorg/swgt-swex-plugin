const pluginName = 'SWGTLogger';
export default {
    hasCacheMatch(proxy, config, resp, cache) {
        if (!this.hasAPISettings(config, proxy)) return false;
        var respCopy = JSON.parse(JSON.stringify(resp)); //Deep copy
        var action = respCopy['command'];

        //Remove stuff that is auto generated, time stamp or request related
        if ('log_type' in respCopy) { action += '_' + respCopy['log_type'] };
        if ('ts_val' in respCopy) { delete respCopy['ts_val'] };
        if ('tvalue' in respCopy) { delete respCopy['tvalue'] };
        if ('tvaluelocal' in respCopy) { delete respCopy['tvaluelocal'] };
        if ('reqid' in respCopy) { delete respCopy['reqid'] };

        //proxy.log({ type: 'debug', source: 'plugin', name: pluginName, message: "Response: " + JSON.stringify(resp) });
        if (!(action in cache)) {
            proxy.log({ type: 'debug', source: 'plugin', name: pluginName, message: "Not in cache:  " + action });



        } else {
            var respTest = JSON.stringify(respCopy);
            var cacheTest = JSON.stringify(cache[action]);

            if (cacheTest === respTest) {
                proxy.log({ type: 'debug', source: 'plugin', name: pluginName, message: "Matched cache:  " + action });
                return true;
            } else {
                proxy.log({ type: 'debug', source: 'plugin', name: pluginName, message: "No match cache:  " + action });
            }
            for (var k in cacheTimerSettings) {
                if (cacheTimerSettings[k].command === action) {
                    var currentTime = new Date().getTime();
                    var timeDifference = currentTime - cacheDuration[action];
                    if (timeDifference < cacheTimerSettings[k].timer) {
                        timerMinutes = cacheTimerSettings[k].timer / 60000;
                        proxy.log({ type: 'debug', source: 'plugin', name: pluginName, message: "Time between last packet < " + timerMinutes + " minute(s) for:  " + action });
                        return true;
                    }
                }
            }
        };

        cache[action] = respCopy;
        cacheDuration[action] = new Date().getTime();

        return false;
    }
}