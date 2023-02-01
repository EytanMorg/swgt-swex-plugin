const request = require('request');
const pluginName = 'SWGTLogger';
const pluginVersion = '2023-01-08_0719';

export default {
    checkVersion(proxy) {
        //check version number
        var endpoint = "https://swgt.io/api/v1";
        let options = {
            method: 'get',
            uri: endpoint
        };

        //proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `API Version Check` });

        request(options, (error, response) => {
            if (error) {
                proxy.log({ type: 'error', source: 'plugin', name: this.pluginName, message: `Error: ${error.message}` });
                return;
            }
            //Check current version of SWGT Plugin as listed on site.
            if (response.statusCode === 200) {
                versionResponse = JSON.parse(response.body);
                if (versionResponse.message == pluginVersion) {
                    proxy.log({
                        type: 'success', source: 'plugin', name: this.pluginName,
                        message: `Initializing version ${pluginName}_${pluginVersion}. You have the latest version!`
                    });
                } else {
                    proxy.log({
                        type: 'warning', source: 'plugin', name: this.pluginName,
                        message: `Initializing version ${pluginName}_${pluginVersion}. There is a new version available on GitHub. Please visit https://github.com/Cerusa/swgt-swex-plugin/releases/latest and download the latest version.`
                    });
                }
            } else {
                proxy.log({
                    type: 'error',
                    source: 'plugin',
                    name: this.pluginName,
                    message: `Server responded with code: ${response.statusCode} = ${response.body}`
                });
            }
        });
    }
}