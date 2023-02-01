const fs = require('fs');
const path = require('path');
const pluginName = 'SWGTLogger';

export default {
    writeToFile(proxy, resp, prefix) {
        if (!config.Config.Plugins[pluginName].enabled) return;
        if (!config.Config.Plugins[pluginName].saveToFile) return;
        let filename = prefix + '-' + resp['command'] + '-' + new Date().getTime() + '.json';
        let outFile = fs.createWriteStream(path.join(config.Config.App.filesPath, filename), {
            flags: 'w',
            autoClose: true
        });

        outFile.write(JSON.stringify(resp, true, 2));
        outFile.end();
        proxy.log({ type: 'success', source: 'plugin', name: this.pluginName, message: 'Saved data to '.concat(filename) });
    }
};