export default {
    verifyPacketToSend(proxy, config, req, resp) {
        verifyCheck = true;
        if ('wizard_id' in req) {
            var i = apiReference.enabledWizards.length;
            while (i--) {
                if (apiReference.enabledWizards[i] === req.wizard_id) {
                    verifyCheck = true;
                    i = 0;
                } else {
                    verifyCheck = false;
                }
            }
        } else {
            verifyCheck = true;
        }
        proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: "Verify Guild: " + `${verifyCheck}` + "-" + `${resp['command']}` });
        return verifyCheck;
    }
}