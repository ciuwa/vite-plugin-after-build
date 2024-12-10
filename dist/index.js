// src/index.ts
import path from "node:path";
import fs from "node:fs";
import { Client } from "basic-ftp";
import { execSync } from "node:child_process";

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
function log(...messages) {
  console.log("\u3010vite-plugin-after-build\u3011" + messages.join(" "));
}

// src/index.ts
import { merge } from "lodash-es";
var defaultOptions = {
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
    localPath: "",
    remotePath: "",
    verbose: false
  }
};
var oldVersion = "";
var newVersion = "";
var pkgPath = path.resolve(process.cwd(), "package.json");
function autoVersionPlugin(options = {}) {
  const __options = merge(defaultOptions, options);
  let buildSuccessful = false;
  return {
    name: "vite-plugin-after-build",
    buildStart() {
      const { enable, threshold = 100 } = __options.updateVersion || {};
      if (enable) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        oldVersion = pkg.version;
        newVersion = incrementVersion(pkg.version, threshold);
        pkg.version = newVersion;
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf-8");
        log(`Version update succeed! ${oldVersion} -> ${newVersion}`);
      }
    },
    async buildEnd(error) {
      if (!error) {
        buildSuccessful = true;
        await Promise.all([
          gitCommit(__options.gitCommit || { enable: false }),
          ftpUpload(__options.ftpUpload || { enable: false })
        ]);
      }
      if (error && !buildSuccessful && oldVersion !== "") {
        revertVersion(oldVersion);
      }
    }
  };
}
function revertVersion(version) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  pkg.version = version;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf-8");
  log(`Version reverted to ${version}`);
}
async function ftpUpload(options) {
  const { enable, host, user, password, localPath, remotePath, verbose = false, secure } = options;
  if (!enable) return;
  if (host && user && password && localPath && remotePath) {
    if (!fs.existsSync(localPath)) {
      throw new Error(`Local file not found: ${localPath}`);
    }
    const client = new Client();
    client.ftp.verbose = verbose;
    try {
      await client.access({ host, user, password, secure });
      await client.ensureDir(remotePath);
      await client.uploadFromDir(localPath);
      log(`Upload succeed! ${localPath} -> ${remotePath}`);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      client.close();
    }
  } else {
    throw new Error('Params error. "host", "user", "password", "localPath", and "remotePath" are required.');
  }
}
async function gitCommit(options) {
  const { enable, push, tag } = options || {};
  if (!enable) return;
  try {
    try {
      execSync("git add .", { stdio: "inherit" });
      const commitMessage = `Auto-commit: build on ${(/* @__PURE__ */ new Date()).toISOString()}`;
      execSync(`git commit -m "${commitMessage}" --no-verify`, { stdio: "inherit" });
      if (tag) {
        execSync(`git tag -a v${newVersion} -m "Auto-tag version v${newVersion}"`, { stdio: "inherit" });
      }
      if (push) {
        execSync("git push", { stdio: "inherit" });
        if (tag) {
          execSync(`git push origin v${newVersion}`, { stdio: "inherit" });
        }
      }
      log(`Git commit successfully`);
    } catch (error) {
      console.error("Git commit failed", error);
    }
  } catch (error) {
    console.error("Git commit failed", error);
  }
}
export {
  autoVersionPlugin as default
};
