/* global MessageChannel Promise Worker URL */
// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer as ipc } from 'electron';

// const project = new Worker(new URL('./workers/project.js', import.meta.url), {
//   type: 'module',
// });

// should this not be called exposeInRendererWorld?
contextBridge.exposeInMainWorld('electron', {
  selectDirectory: () => ipc.invoke('select-directory'),
  listDirectory: (dir) => ipc.invoke('list-directory', dir),
});

// contextBridge.exposeInMainWorld('project', {
//   open(path) {
//     project.postMessage({ type: 'open-project', value: { path } });
//   },
// });
