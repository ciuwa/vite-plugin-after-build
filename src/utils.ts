export function incrementVersion(currentVersion: string, threshold: number): string {
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

export function log(...messages: string[]) {
  console.log("【vite-plugin-after-build】" + messages.join(' '));
}  