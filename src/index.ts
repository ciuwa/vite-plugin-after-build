import path from 'node:path';
import fs from 'node:fs';
import { Client } from "basic-ftp"
import { execSync } from 'node:child_process';

import { Plugin } from 'vite';
import { type ViteAfterBuildPluginOptions, type FtpUploadOptions, type GitCommitOptions } from './types.ts'
import { incrementVersion, log } from './utils.ts'
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
    remotePath: '',
    verbose: false
  }
}

let oldVersion = '';
let newVersion = '';
const pkgPath = path.resolve(process.cwd(), 'package.json');

export default function autoVersionPlugin(options: ViteAfterBuildPluginOptions = {}): Plugin {

  const __options = merge(defaultOptions, options)
  let buildSuccessful = false;
  const { enable, threshold = 100 } = __options.updateVersion || {};

  return {
    name: 'vite-plugin-after-build',

    buildStart() {
      if (enable) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        oldVersion = pkg.version;
        newVersion = incrementVersion(pkg.version, threshold);
        pkg.version = newVersion;
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
      }
    },

    async buildEnd(error) {
      if (enable) {
        log(`Version update succeed! ${oldVersion} -> ${newVersion}`);
      }
      if (!error) {
        buildSuccessful = true;
        await Promise.all([
          gitCommit(__options.gitCommit || { enable: false } as any),
          ftpUpload(__options.ftpUpload || { enable: false } as any),
        ]);
      }
      // 构建失败，则将版本号 revert  
      if (enable && error && !buildSuccessful && oldVersion !== '') {
        revertVersion(oldVersion)
      }
    }
  };
}


function revertVersion(version: string): void {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { version: string };
  pkg.version = version;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
  log(`Version reverted to ${version}`);
}

async function ftpUpload(options: FtpUploadOptions): Promise<void> {

  const { enable, host, user, password, localPath, remotePath, verbose = false, secure } = options;

  if (!enable) return;

  if (host && user && password && localPath && remotePath) {

    // 确保本地文件存在
    if (!fs.existsSync(localPath)) {
      throw new Error(`Local file not found: ${localPath}`);
    }
    const client = new Client()
    client.ftp.verbose = verbose // 设置为 true 可以打印出详细的调试信息
    try {
      await client.access({ host, user, password, secure });
      await client.ensureDir(remotePath)
      await client.uploadFromDir(localPath)
      log(`Upload succeed! ${localPath} -> ${remotePath}`)
    }
    catch (err) {
      console.error('Upload failed:', err);
    } finally {
      client.close()
    }
  } else {
    throw new Error('Params error. "host", "user", "password", "localPath", and "remotePath" are required.')
  }
}

async function gitCommit(options: GitCommitOptions): Promise<void> {
  const { enable, push, tag } = options || {};
  if (!enable) return;
  try {
    try {
      // 1. 添加所有更改  
      execSync('git add .', { stdio: 'inherit' });

      // 2. 提交更改，使用当前日期和时间作为提交信息  
      const commitMessage = `Auto-commit: build on ${new Date().toISOString()}`;
      execSync(`git commit -m "${commitMessage}" --no-verify`, { stdio: 'inherit' });

      if (tag) {
        execSync(`git tag -a v${newVersion} -m "Auto-tag version v${newVersion}"`, { stdio: 'inherit' });
      }

      if (push) {
        // 6. 推送到远程仓库  s
        execSync('git push', { stdio: 'inherit' }); // 确保替换为实际的默认分支名称  
        if (tag) {
          execSync(`git push origin v${newVersion}`, { stdio: 'inherit' });
        }
      }
      log(`Git commit successfully`);
    } catch (error) {
      console.error('Git commit failed', error);
    }

  } catch (error) {
    console.error('Git commit failed', error);
  }
}
