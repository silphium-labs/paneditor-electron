/* global process __dirname MAIN_WINDOW_VITE_DEV_SERVER_URL MAIN_WINDOW_VITE_NAME Promise URL */
import { app, BrowserWindow, dialog, ipcMain as ipc } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { opendir, open } from 'node:fs/promises';
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8084 });

wss.on('connection', async function connection(socket, request) {
  socket.binaryType = 'arraybuffer';

  if (request.method !== 'GET') throw new Error();
  let url = new URL(`http://localhost${request.url}`);

  if (url.pathname !== '/files') throw new Error();

  let fd = await open(url.searchParams.get('path'));

  await pipeSocket(fd.createReadStream(), socket);
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

async function pipeSocket(stream, socket) {
  let step;
  let resume = null;

  socket.on('message', function (data) {
    let msg = JSON.parse(data.toString());
    switch (msg.type) {
      case 'pause':
        step = new Promise((resolve) => {
          let step_ = step;
          resume = () => resolve(step_);
        });
        break;
      case 'resume':
        resume();
        resume = null;
        break;
      default:
        throw new Error('unknown type');
    }
  });

  let iter = stream[Symbol.asyncIterator]();

  try {
    while (true) {
      step = iter.next();
      step = await step;

      if (step.done) break;

      let chunk = step.value;

      socket.send(chunk.buffer);
    }
  } catch (e) {
    iter.return();
    throw e;
  }
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

async function selectDirectory() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (!canceled) {
    return filePaths[0];
  }
}

async function listDirectory(e, path) {
  let files = [];
  for await (let file of await opendir(path)) {
    files.push({
      name: file.name,
      isDir: await file.isDirectory(),
    });
  }

  return files.sort((a, b) => {
    if (a.isDir !== b.isDir) {
      return a.isDir && !b.isDir ? -1 : 1;
    } else {
      return a.name < b.name ? -1 : b.name < a.name ? 1 : 0;
    }
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  ipc.handle('select-directory', selectDirectory);
  ipc.handle('list-directory', listDirectory);

  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
