import { incrementVersion } from '../src/utils'
import path from 'node:path';
import fs from 'node:fs';

export default function autoVersion() {

  const threshold = 100;
  let oldVersion = '';
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  oldVersion = pkg.version;

  return {
    name: 'auto-version',
    setup(build) {
      console.log(build.initialOptions.format);

      if (build.initialOptions.format !== 'esm') {
        return
      }
      const newVersion = incrementVersion(pkg.version, threshold);
      pkg.version = newVersion;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
      console.log(`Version update to ${newVersion}`);

      // 在构建失败后运行的代码（虽然这里不能直接处理，因为 onEnd 已经处理了）  
      build.onEnd(result => {
        if (result.errors.length > 0 && oldVersion !== '') {
          // 打包失败
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          pkg.version = oldVersion;
          fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
        }
      });
    },
  };
};
