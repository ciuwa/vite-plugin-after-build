"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => autoVersionPlugin
});
module.exports = __toCommonJS(src_exports);
var import_node_path = __toESM(require("path"), 1);
var import_node_fs = __toESM(require("fs"), 1);
var import_basic_ftp = require("basic-ftp");
var import_node_child_process = require("child_process");

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
var import_lodash_es = require("lodash-es");
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
var pkgPath = import_node_path.default.resolve(process.cwd(), "package.json");
function autoVersionPlugin(options = {}) {
  const __options = (0, import_lodash_es.merge)(defaultOptions, options);
  let buildSuccessful = false;
  return {
    name: "vite-plugin-after-build",
    buildStart() {
      const { enable, threshold = 100 } = __options.updateVersion || {};
      if (enable) {
        const pkg = JSON.parse(import_node_fs.default.readFileSync(pkgPath, "utf-8"));
        oldVersion = pkg.version;
        newVersion = incrementVersion(pkg.version, threshold);
        pkg.version = newVersion;
        import_node_fs.default.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf-8");
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
  const pkg = JSON.parse(import_node_fs.default.readFileSync(pkgPath, "utf-8"));
  pkg.version = version;
  import_node_fs.default.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf-8");
  log(`Version reverted to ${version}`);
}
async function ftpUpload(options) {
  const { enable, host, user, password, localPath, remotePath, verbose = false, secure } = options;
  if (!enable) return;
  if (host && user && password && localPath && remotePath) {
    if (!import_node_fs.default.existsSync(localPath)) {
      throw new Error(`Local file not found: ${localPath}`);
    }
    const client = new import_basic_ftp.Client();
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
      (0, import_node_child_process.execSync)("git add .", { stdio: "inherit" });
      const commitMessage = `Auto-commit: build on ${(/* @__PURE__ */ new Date()).toISOString()}`;
      (0, import_node_child_process.execSync)(`git commit -m "${commitMessage}" --no-verify`, { stdio: "inherit" });
      if (tag) {
        (0, import_node_child_process.execSync)(`git tag -a v${newVersion} -m "Auto-tag version v${newVersion}"`, { stdio: "inherit" });
      }
      if (push) {
        (0, import_node_child_process.execSync)("git push", { stdio: "inherit" });
        if (tag) {
          (0, import_node_child_process.execSync)(`git push origin v${newVersion}`, { stdio: "inherit" });
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
