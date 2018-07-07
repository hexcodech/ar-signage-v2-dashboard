const http = require('http');
const fs = require('fs');
const {app} = require('electron');

module.exports = class MediaCache {
    constructor(mediaCacheDownloadUrl) {
        this.mediaCachePath = `${app.getPath('userData')}/mediaCache`;
        this.mediaCacheDownloadUrl = mediaCacheDownloadUrl;
    }

    downloadAndStore(mediaId) {
        return new Promise((resolve, reject) => {
            const dest = `${this.mediaCachePath}/${mediaId}`;
            const file = fs.createWriteStream(dest);
            http.get(`${this.mediaCacheDownloadUrl}/${mediaId}`, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            }).on('error', (err) => {
                fs.unlink(dest); // Delete the file
                reject(`downloadAndStore http error: ${err}`);
                return;
            });
        });
    }

    getLink(mediaId) {
        return new Promise((resolve, reject) => {
            fs.access(`${this.mediaCachePath}/${mediaId}`, (err) => {
                if (err) { // File doesn't exist
                    this.downloadAndStore(mediaId).then(() => {
                        resolve(`file://${this.mediaCachePath}/${mediaId}`);
                        return;
                    }).catch((err) => {
                        reject(`getLink error: ${err}`);
                    });
                }

                resolve(`file://${this.mediaCachePath}/${mediaId}`);
            });
        });
    }
}