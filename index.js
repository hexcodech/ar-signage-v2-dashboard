process.env.NODE_ENV = process.execPath.search('electron-prebuilt') === -1;
const {app, BrowserWindow} = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');

let win;

app.on('ready', createWindow);

function createWindow() {
    win = new BrowserWindow({width: 1600, height: 900, webPreferences:{webSecurity: false}});

    win.loadURL(fs.existsSync('./frontend-app/dist/index.html') ? 
      url.format({
        pathname: path.join(__dirname, 'frontend-app/dist/index.html'),
        protocol: 'file:',
        slashes: true,
      })
       : 
      url.format({
        pathname: 'localhost:4200',
        protocol: 'http',
        slashes: true,
      })
    );
    win.webContents.openDevTools();
}