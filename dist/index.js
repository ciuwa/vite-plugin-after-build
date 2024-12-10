// src/index.ts
import path from "node:path";
import fs from "node:fs";

// src/utils.ts
function incrementVersion(currentVersion, threshold) {
  const [major, minor, patch] = currentVersion.split(".").map(Number);
  let newPatch = patch + 1;
  if (newPatch > threshold) {
    newPatch = 0;
    let newMinor = minor + 1;
    if (newMinor > threshold) {
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

// src/index.ts
import { merge } from "lodash-es";
var defaultOptions = {
  autoVersion: {
    disabled: false,
    threshold: 100
  },
  beforeBuild: void 0,
  afterBuild: void 0
};
function autoVersionPlugin(options = {}) {
  const __options = merge(options, defaultOptions);
  console.log(__options);
  let buildSuccessful = false;
  let oldVersion = "";
  const pkgPath = path.resolve(process.cwd(), "package.json");
  const disabled = options.autoVersion?.disabled ?? false;
  if (disabled) {
    return {
      name: "vite-plugin-after-build"
    };
  }
  return {
    name: "vite-plugin-after-build",
    buildStart() {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      oldVersion = pkg.version;
      const max = options.autoVersion.threshold ?? 100;
      const newVersion = incrementVersion(pkg.version, max);
      pkg.version = newVersion;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf-8");
      console.log(`Version update to ${newVersion}`);
    },
    buildEnd(error) {
      if (!error) {
        buildSuccessful = true;
      }
      if (error && !buildSuccessful && oldVersion !== "") {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        pkg.version = oldVersion;
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf-8");
      }
      if (options.afterBuild) {
        options.afterBuild(error);
      }
    }
  };
}
export {
  autoVersionPlugin as default
};
