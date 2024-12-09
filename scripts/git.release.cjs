const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const packagePath = path.join(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

pkg.version = incrementVersion(pkg.version)

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2), 'utf8');

try {
  const newVersion = 'v' + pkg.version;
  execSync('git add .', { stdio: 'inherit' });

  const commitMessage = `Release ${newVersion}, build on ${new Date().toISOString()}`;
  execSync(`git commit -m "${commitMessage}" --no-verify`, { stdio: 'inherit' });

  // 5. 创建标签  
  execSync(`git tag -a ${newVersion} -m "Release version ${newVersion}"`, { stdio: 'inherit' });

  // 6. 推送到远程仓库  
  execSync('git push origin main', { stdio: 'inherit' });
  // execSync(`git push origin v${newVersion}`, { stdio: 'inherit' });
  console.log(`Version updated ${newVersion}`);
} catch (error) {
  console.error('Failed to commit changes or create a tag:', error.message);
}


function incrementVersion(currentVersion, threshold) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  let newPatch = patch + 1;
  if (newPatch > threshold) {
    newPatch = 0;
    let newMinor = minor + 1;
    if (newMinor > threshold) { // 通常 minor 不会有上限，这里仅按您的要求处理
      newMinor = 0;
      const newMajor = major + 1;
      return `${newMajor}.${newMinor}.${newPatch}`;
    } else {
      return `${major}.${newMinor}.${newPatch}`;
    }
  } else {
    return `${major}.${minor}.${newPatch}`;
  }
}