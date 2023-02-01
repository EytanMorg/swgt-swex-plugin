export default {
    hasAPIEnabled(config, proxy) {
        if (!config.Config.Plugins[pluginName].enabled) return false;

        if (!config.Config.Plugins[pluginName].apiKey) {
            proxy.log({ type: 'error', source: 'plugin', name: this.pluginName, message: 'Missing API key.' });
            return false;
        }
        return true;
    }
}