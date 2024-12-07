import path from 'node:path';
import fs from 'node:fs';
import { Plugin } from 'vite';
import { AutoVersionPluginOptions } from './types.ts'
import { incrementVersion } from './utils.ts'

export default function autoVersionPlugin(options: AutoVersionPluginOptions = {}): Plugin {

  let buildSuccessful = false;
  let oldVersion = '';
  const pkgPath = path.resolve(process.cwd(), 'package.json');

  const disabled = options.disabled ?? false;

  if (disabled) {
    return {
      name: 'vite-plugin-after-build'
    }
  }

  return {
    name: 'vite-plugin-after-build',
    buildStart() {

      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      oldVersion = pkg.version;

      const max = options.threshold ?? 100;
      const newVersion = incrementVersion(pkg.version, max);
      pkg.version = newVersion;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
      console.log(`Version update to ${newVersion}`);
    },

    buildEnd(error) {
      if (!error) {
        buildSuccessful = true;
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