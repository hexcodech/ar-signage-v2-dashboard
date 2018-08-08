process.env.NODE_ENV = process.execPath.search('electron-prebuilt') === -1;
const {app, BrowserWindow, globalShortcut} = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');

let win;

app.on('ready', createWindow);
app.on('window-all-closed', () => {
    app.quit()
});

function createWindow() {
    win = new BrowserWindow({width: 1600, height: 900, webPreferences:{webSecurity: false}});

    win.loadURL(fs.existsSync(path.join(__dirname, 'frontend-app/dist/ar-signage-v2-dashboard/index.html')) ? 
      url.format({
        pathname: path.join(__dirname, 'frontend-app/dist/ar-signage-v2-dashboard/index.html'),
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
    if (!fs.existsSync(path.join(__dirname, 'frontend-app/dist/ar-signage-v2-dashboard/index.html')))
      win.webContents.openDevTools();

    globalShortcut.register('CommandOrControl+Shift+I', () => {
      win.webContents.openDevTools();
    });

    win.on('closed', () => {
      win = null
    });
}