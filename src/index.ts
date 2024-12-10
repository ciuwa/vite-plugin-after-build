import path from 'node:path';
import fs from 'node:fs';
import { Client } from "basic-ftp"
import { execSync } from 'node:child_process';

import { Plugin } from 'vite';
import { ViteAfterBuildPluginOptions } from './types.ts'
import { incrementVersion } from './utils.ts'
import { merge } from 'lodash-es'

const defaultOptions: ViteAfterBuildPluginOptions = {
  updateVersion: {
    enable: true,
    threshold: 100
  },
  gitCommit: {
    enable: false,
    push: false
  },
  ftpUpload: {
    enable: false,
    host: "",
    user: "",
    password: "",
    secure: false,
    localPath: '',
    remotePath: ''
  }
}

export default function autoVersionPlugin(options: ViteAfterBuildPluginOptions = {}): Plugin {

  const __options = merge(defaultOptions, options)

  let buildSuccessful = false;
  let oldVersion = '';

  const pkgPath = path.resolve(process.cwd(), 'package.json');

  return {
    name: 'vite-plugin-after-build',
    buildStart() {
      const { enable, threshold = 100 } = __options.updateVersion || {};
      if (enable) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        oldVersion = pkg.version;

        const newVersion = incrementVersion(pkg.version, threshold);
        pkg.version = newVersion;
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
        console.log(`Version update to ${newVersion}`);
      }
    },

    async buildEnd(error) {
      if (!error) {
        buildSuccessful = true;
        // build succeed run git commit 
        const { enable, push } = __options.gitCommit || {};

        if (enable) {
          try {
            // 1. 添加所有更改  
            execSync('git add .', { stdio: 'inherit' });

            // 2. 提交更改，使用当前日期和时间作为提交信息  
            const commitMessage = `Auto-commit: build on ${new Date().toISOString()}`;
            execSync(`git commit -m "${commitMessage}" --no-verify`, { stdio: 'inherit' });

            if (push) {
              // 6. 推送到远程仓库  s
              execSync('git push origin master', { stdio: 'inherit' }); // 确保替换为实际的默认分支名称  
            }
            console.log(`Git commit successfully`);
          } catch (error) {
            console.error('Git commit failed', error);
          }
        }
        const { enable: ftpEnable, host, user, password, secure, localPath, remotePath } = __options.ftpUpload || {};

        if (ftpEnable) {
          if (host && user && password && localPath && remotePath) {

            // 确保本地文件存在
            if (!fs.existsSync(localPath)) {
              throw new Error(`Local file not found: ${localPath}`);
            }

            const client = new Client()
            client.ftp.verbose = true // 设置为 true 可以打印出详细的调试信息
            try {
              await client.access({
                host,
                user,
                password,
                secure
              })
              await client.ensureDir(remotePath)
              await client.uploadFromDir(localPath)
              console.log(`Upload succeed! ${localPath} -> ${remotePath}`)
            }
            catch (err) {
              console.log(err)
            } finally {
              client.close()
            }
          } else {
            throw new Error('params error host && user && password && localPath && remotePath required')
          }
        }

      }
      // 构建失败，则将版本号 revert  
      if (error && !buildSuccessful && oldVersion !== '') {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        pkg.version = oldVersion;
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
      }
    }
  };
}