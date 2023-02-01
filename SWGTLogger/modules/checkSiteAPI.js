export default {
    checkSiteAPI(proxy, config) {
        //check site api configuration settings
        if (!this.hasAPIEnabled(config, proxy)) {
            //proxy.log({ type: 'error', source: 'plugin', name: this.pluginName, message: `API Settings not yet configured.` });
            return;
        }
        resp = {};
        resp.command = "checkAPIKey";
        //var endpoint = "/api/v1";
        var endpoint = "/api/guild/swgt/v1";

        let options = {
            method: 'post',
            uri: config.Config.Plugins[pluginName].siteURL + endpoint + '?apiKey=' + config.Config.Plugins[pluginName].apiKey,
            json: true,
            body: resp
        };
        //proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Check Site API settings` });
        request(options, (error, response) => {
            if (error) {
                proxy.log({ type: 'error', source: 'plugin', name: this.pluginName, message: `Failed to connect to ${config.Config.Plugins[pluginName].siteURL}` });
                return;
            }

            if (response.statusCode === 200) {
                proxy.log({ type: 'success', source: 'plugin', name: this.pluginName, message: `Successfully connected to ${config.Config.Plugins[pluginName].siteURL}` });
                siteAPIResponse = response.body;
                if ('messageType' in siteAPIResponse) { apiReference.messageType = siteAPIResponse.messageType };
                if ('enabledGuilds' in siteAPIResponse) { apiReference.enabledGuilds = siteAPIResponse.enabledGuilds };
                proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Guild apiReference: ${apiReference.messageType}` });
            } else if (response.statusCode === 401) {
                proxy.log({

                    type: 'error',
                    source: 'plugin',
                    name: this.pluginName,
                    message: `Failed to connect to ${config.Config.Plugins[pluginName].siteURL}: Invalid API Key.`
                });
            } else {
                proxy.log({
                    type: 'error',
                    source: 'plugin',
                    name: this.pluginName,
                    message: `Failed to connect to ${config.Config.Plugins[pluginName].siteURL}. ${response.body}`
                });
            }
        });
    }
}