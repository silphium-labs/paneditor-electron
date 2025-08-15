// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  listDirectory: (dir) => ipcRenderer.invoke('list-directory', dir),
  openFile: (file) => ipcRenderer.invoke('open-file', file),
  readChunk: (file) => ipcRenderer.invoke('read-chunk', file),
});
