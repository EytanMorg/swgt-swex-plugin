export default {
    hasAPISettings(config, proxy) {
        if (localAPIkey != config.Config.Plugins[pluginName].apiKey) {
            this.checkSiteAPI(proxy, config);
            localAPIkey = config.Config.Plugins[pluginName].apiKey;
        }
        if (apiReference.messageType === 'OK') {
            //proxy.log({ type: 'DEBUG', source: 'plugin', name: this.pluginName, message: 'API Key Good' });
            return true;
        }
        if (apiReference.messageType === 'Warning') {
            proxy.log({ type: 'warning', source: 'plugin', name: this.pluginName, message: 'API Key near expiration' });
            return true;
        }
        if (apiReference.messageType === 'Error') {
            proxy.log({ type: 'error', source: 'plugin', name: this.pluginName, message: 'API Key Incorrect or Expired.' });
            return false;
        }
        return false;
    }
}