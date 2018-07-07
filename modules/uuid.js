const os = require('os');

module.exports = class UUID {
    constructor() {}
    
    getMainNetworkInterface() {
        const networkInterfaces = os.networkInterfaces();
        if (networkInterfaces.Ethernet)
            return networkInterfaces.Ethernet[1];
        else if (networkInterfaces.en0)
            return networkInterfaces.en0[1];
        else if (networkInterfaces.eth0)
            return networkInterfaces.eth0[1];
        else if (networkInterfaces[0][1])
            return networkInterfaces[0][1];
        else
            return networkInterfaces[0][0];
    }

    getUUID() {
        return this.getMainNetworkInterface().mac;
    }
}