import { defineConfig } from 'vite';
import afterBuild from '../src/index.js';

export default defineConfig({
  plugins: [
    afterBuild({
      updateVersion: {
        enable: true
      },
      gitCommit: {
        enable: true,
        push: true
      },
      ftpUpload: {
        enable: true,
        host: "127.0.0.1",
        user: "uname",
        password: "upass",
        localPath: '/src/',
        remotePath: '/www/'
      }
    })
  ],
  // ... other configuration options
});