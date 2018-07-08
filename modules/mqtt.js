const mqtt = require('mqtt');
const ip = require('ip');
const evilscan = require('evilscan');
const uuidModule = new (require('./uuid'))();

module.exports = class MQTT {
    constructor() {
        this.mqttClient = null;
        this.mqttMessageCallback;
    }

    setCallback(callback) {
        this.mqttMessageCallback = callback;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.evilScanner = new evilscan({
                target: `${ip.mask(uuidModule.getMainNetworkInterface().address, ip.fromPrefixLen(24))}/24`,
                port: '1883',
                status: 'O',
            }, (err, scan) => {
                if (err) {
                    reject(`evilScanner error: ${err}`);
                    return;
                }
                let foundSuccess = false;

                scan.on('result', (data) => {
                    foundSuccess = true;
                    this.mqttClient = mqtt.connect(`mqtt://${data.ip}`);
                    this.mqttClient.on('connect', () => {
                        resolve(data.ip);
                    });
                    this.mqttClient.on('message', (topic, message) => this.mqttMessageCallback(topic, message));
                    this.mqttClient.on('error', (err) => {
                        reject(`mqtt error: ${err}`);
                    });
                    return;
                });

                scan.on('error', (err) => {
                    reject(`evilScanner error: ${err}`);
                    return;
                })

                scan.on('done', () => {
                    if (!foundSuccess) {
                        reject(`evilScanner error: No suitable mqtt server found`);
                        return;
                    }
                })

                scan.run();
            });
        });
    }
}