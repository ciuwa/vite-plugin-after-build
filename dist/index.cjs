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
function autoVersionPlugin(options = {}) {
  let buildSuccessful = false;
  let oldVersion = "";
  const pkgPath = import_node_path.default.resolve(process.cwd(), "package.json");
  const disabled = options.disabled ?? false;
  if (disabled) {
    return {
      name: "vite-plugin-auto-version"
    };
  }
  return {
    name: "vite-plugin-auto-version",
    buildStart() {
      const pkg = JSON.parse(import_node_fs.default.readFileSync(pkgPath, "utf-8"));
      oldVersion = pkg.version;
      const max = options.threshold ?? 100;
      const newVersion = incrementVersion(pkg.version, max);
      pkg.version = newVersion;
      import_node_fs.default.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf-8");
      console.log(`Version update to ${newVersion}`);
    },
    buildEnd(error) {
      if (!error) {
        buildSuccessful = true;
      }
      if (error && !buildSuccessful && oldVersion !== "") {
        const pkg = JSON.parse(import_node_fs.default.readFileSync(pkgPath, "utf-8"));
        pkg.version = oldVersion;
        import_node_fs.default.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf-8");
      }
    }
  };
}
