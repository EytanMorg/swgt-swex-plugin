export default {
    uploadToWebService(proxy, config, req, resp, endpointType) {
        if (!this.hasAPISettings(config, proxy)) return;
        if (!this.verifyPacketToSend(proxy, config, req, resp)) return;
        const { command } = req;

        var endpoint = "/api/v1";
        if ("3MDC" == endpointType)
            endpoint = "/api/3mdc/v1";

        let options = {
            method: 'post',
            uri: config.Config.Plugins[pluginName].siteURL + endpoint + '?apiKey=' + config.Config.Plugins[pluginName].apiKey,
            json: true,
            body: resp
        };
        //proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `Upload to Webservice: ${resp['command']}` });
        request(options, (error, response) => {
            if (error) {
                proxy.log({ type: 'error', source: 'plugin', name: this.pluginName, message: `Error: ${error.message}` });
                return;
            }

            if (response.statusCode === 200) {
                proxy.log({ type: 'success', source: 'plugin', name: this.pluginName, message: `${command} uploaded successfully` });
            } else {
                proxy.log({
                    type: 'error',
                    source: 'plugin',
                    name: this.pluginName,
                    message: `${command} upload failed: Server responded with code: ${response.statusCode} = ${response.body}`
                });

                //Remove from cache if rate limited
                try {
                    if (response.body.includes("updated in the past")) {
                        var action = resp['command'];
                        delete cache[action];
                    }
                } catch (error) { }
            }
        });
    },
}