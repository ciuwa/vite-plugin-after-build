"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
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

// node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/parseControlResponse.js
var require_parseControlResponse = __commonJS({
  "node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/parseControlResponse.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.positiveIntermediate = exports2.positiveCompletion = exports2.isMultiline = exports2.isSingleLine = exports2.parseControlResponse = void 0;
    var LF = "\n";
    function parseControlResponse(text) {
      const lines = text.split(/\r?\n/).filter(isNotBlank);
      const messages = [];
      let startAt = 0;
      let tokenRegex;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!tokenRegex) {
          if (isMultiline(line)) {
            const token = line.substr(0, 3);
            tokenRegex = new RegExp(`^${token}(?:$| )`);
            startAt = i;
          } else if (isSingleLine(line)) {
            messages.push(line);
          }
        } else if (tokenRegex.test(line)) {
          tokenRegex = void 0;
          messages.push(lines.slice(startAt, i + 1).join(LF));
        }
      }
      const rest = tokenRegex ? lines.slice(startAt).join(LF) + LF : "";
      return { messages, rest };
    }
    exports2.parseControlResponse = parseControlResponse;
    function isSingleLine(line) {
      return /^\d\d\d(?:$| )/.test(line);
    }
    exports2.isSingleLine = isSingleLine;
    function isMultiline(line) {
      return /^\d\d\d-/.test(line);
    }
    exports2.isMultiline = isMultiline;
    function positiveCompletion(code) {
      return code >= 200 && code < 300;
    }
    exports2.positiveCompletion = positiveCompletion;
    function positiveIntermediate(code) {
      return code >= 300 && code < 400;
    }
    exports2.positiveIntermediate = positiveIntermediate;
    function isNotBlank(str) {
      return str.trim() !== "";
    }
  }
});

// node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/FtpContext.js
var require_FtpContext = __commonJS({
  "node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/FtpContext.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.FTPContext = exports2.FTPError = void 0;
    var net_1 = require("net");
    var parseControlResponse_1 = require_parseControlResponse();
    var FTPError = class extends Error {
      constructor(res) {
        super(res.message);
        this.name = this.constructor.name;
        this.code = res.code;
      }
    };
    exports2.FTPError = FTPError;
    function doNothing() {
    }
    var FTPContext = class {
      /**
       * Instantiate an FTP context.
       *
       * @param timeout - Timeout in milliseconds to apply to control and data connections. Use 0 for no timeout.
       * @param encoding - Encoding to use for control connection. UTF-8 by default. Use "latin1" for older servers.
       */
      constructor(timeout = 0, encoding = "utf8") {
        this.timeout = timeout;
        this.verbose = false;
        this.ipFamily = void 0;
        this.tlsOptions = {};
        this._partialResponse = "";
        this._encoding = encoding;
        this._socket = this.socket = this._newSocket();
        this._dataSocket = void 0;
      }
      /**
       * Close the context.
       */
      close() {
        const message = this._task ? "User closed client during task" : "User closed client";
        const err = new Error(message);
        this.closeWithError(err);
      }
      /**
       * Close the context with an error.
       */
      closeWithError(err) {
        if (this._closingError) {
          return;
        }
        this._closingError = err;
        this._closeControlSocket();
        this._closeSocket(this._dataSocket);
        this._passToHandler(err);
        this._stopTrackingTask();
      }
      /**
       * Returns true if this context has been closed or hasn't been connected yet. You can reopen it with `access`.
       */
      get closed() {
        return this.socket.remoteAddress === void 0 || this._closingError !== void 0;
      }
      /**
       * Reset this contex and all of its state.
       */
      reset() {
        this.socket = this._newSocket();
      }
      /**
       * Get the FTP control socket.
       */
      get socket() {
        return this._socket;
      }
      /**
       * Set the socket for the control connection. This will only close the current control socket
       * if the new one is not an upgrade to the current one.
       */
      set socket(socket) {
        this.dataSocket = void 0;
        this.tlsOptions = {};
        this._partialResponse = "";
        if (this._socket) {
          const newSocketUpgradesExisting = socket.localPort === this._socket.localPort;
          if (newSocketUpgradesExisting) {
            this._removeSocketListeners(this.socket);
          } else {
            this._closeControlSocket();
          }
        }
        if (socket) {
          this._closingError = void 0;
          socket.setTimeout(0);
          socket.setEncoding(this._encoding);
          socket.setKeepAlive(true);
          socket.on("data", (data) => this._onControlSocketData(data));
          socket.on("end", () => this.closeWithError(new Error("Server sent FIN packet unexpectedly, closing connection.")));
          socket.on("close", (hadError) => {
            if (!hadError)
              this.closeWithError(new Error("Server closed connection unexpectedly."));
          });
          this._setupDefaultErrorHandlers(socket, "control socket");
        }
        this._socket = socket;
      }
      /**
       * Get the current FTP data connection if present.
       */
      get dataSocket() {
        return this._dataSocket;
      }
      /**
       * Set the socket for the data connection. This will automatically close the former data socket.
       */
      set dataSocket(socket) {
        this._closeSocket(this._dataSocket);
        if (socket) {
          socket.setTimeout(0);
          this._setupDefaultErrorHandlers(socket, "data socket");
        }
        this._dataSocket = socket;
      }
      /**
       * Get the currently used encoding.
       */
      get encoding() {
        return this._encoding;
      }
      /**
       * Set the encoding used for the control socket.
       *
       * See https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings for what encodings
       * are supported by Node.
       */
      set encoding(encoding) {
        this._encoding = encoding;
        if (this.socket) {
          this.socket.setEncoding(encoding);
        }
      }
      /**
       * Send an FTP command without waiting for or handling the result.
       */
      send(command) {
        const containsPassword = command.startsWith("PASS");
        const message = containsPassword ? "> PASS ###" : `> ${command}`;
        this.log(message);
        this._socket.write(command + "\r\n", this.encoding);
      }
      /**
       * Send an FTP command and handle the first response. Use this if you have a simple
       * request-response situation.
       */
      request(command) {
        return this.handle(command, (res, task) => {
          if (res instanceof Error) {
            task.reject(res);
          } else {
            task.resolve(res);
          }
        });
      }
      /**
       * Send an FTP command and handle any response until you resolve/reject. Use this if you expect multiple responses
       * to a request. This returns a Promise that will hold whatever the response handler passed on when resolving/rejecting its task.
       */
      handle(command, responseHandler) {
        if (this._task) {
          const err = new Error("User launched a task while another one is still running. Forgot to use 'await' or '.then()'?");
          err.stack += `
Running task launched at: ${this._task.stack}`;
          this.closeWithError(err);
        }
        return new Promise((resolveTask, rejectTask) => {
          this._task = {
            stack: new Error().stack || "Unknown call stack",
            responseHandler,
            resolver: {
              resolve: (arg) => {
                this._stopTrackingTask();
                resolveTask(arg);
              },
              reject: (err) => {
                this._stopTrackingTask();
                rejectTask(err);
              }
            }
          };
          if (this._closingError) {
            const err = new Error(`Client is closed because ${this._closingError.message}`);
            err.stack += `
Closing reason: ${this._closingError.stack}`;
            err.code = this._closingError.code !== void 0 ? this._closingError.code : "0";
            this._passToHandler(err);
            return;
          }
          this.socket.setTimeout(this.timeout);
          if (command) {
            this.send(command);
          }
        });
      }
      /**
       * Log message if set to be verbose.
       */
      log(message) {
        if (this.verbose) {
          console.log(message);
        }
      }
      /**
       * Return true if the control socket is using TLS. This does not mean that a session
       * has already been negotiated.
       */
      get hasTLS() {
        return "encrypted" in this._socket;
      }
      /**
       * Removes reference to current task and handler. This won't resolve or reject the task.
       * @protected
       */
      _stopTrackingTask() {
        this.socket.setTimeout(0);
        this._task = void 0;
      }
      /**
       * Handle incoming data on the control socket. The chunk is going to be of type `string`
       * because we let `socket` handle encoding with `setEncoding`.
       * @protected
       */
      _onControlSocketData(chunk) {
        this.log(`< ${chunk}`);
        const completeResponse = this._partialResponse + chunk;
        const parsed = (0, parseControlResponse_1.parseControlResponse)(completeResponse);
        this._partialResponse = parsed.rest;
        for (const message of parsed.messages) {
          const code = parseInt(message.substr(0, 3), 10);
          const response = { code, message };
          const err = code >= 400 ? new FTPError(response) : void 0;
          this._passToHandler(err ? err : response);
        }
      }
      /**
       * Send the current handler a response. This is usually a control socket response
       * or a socket event, like an error or timeout.
       * @protected
       */
      _passToHandler(response) {
        if (this._task) {
          this._task.responseHandler(response, this._task.resolver);
        }
      }
      /**
       * Setup all error handlers for a socket.
       * @protected
       */
      _setupDefaultErrorHandlers(socket, identifier) {
        socket.once("error", (error) => {
          error.message += ` (${identifier})`;
          this.closeWithError(error);
        });
        socket.once("close", (hadError) => {
          if (hadError) {
            this.closeWithError(new Error(`Socket closed due to transmission error (${identifier})`));
          }
        });
        socket.once("timeout", () => {
          socket.destroy();
          this.closeWithError(new Error(`Timeout (${identifier})`));
        });
      }
      /**
       * Close the control socket. Sends QUIT, then FIN, and ignores any response or error.
       */
      _closeControlSocket() {
        this._removeSocketListeners(this._socket);
        this._socket.on("error", doNothing);
        this.send("QUIT");
        this._closeSocket(this._socket);
      }
      /**
       * Close a socket, ignores any error.
       * @protected
       */
      _closeSocket(socket) {
        if (socket) {
          this._removeSocketListeners(socket);
          socket.on("error", doNothing);
          socket.destroy();
        }
      }
      /**
       * Remove all default listeners for socket.
       * @protected
       */
      _removeSocketListeners(socket) {
        socket.removeAllListeners();
        socket.removeAllListeners("timeout");
        socket.removeAllListeners("data");
        socket.removeAllListeners("end");
        socket.removeAllListeners("error");
        socket.removeAllListeners("close");
        socket.removeAllListeners("connect");
      }
      /**
       * Provide a new socket instance.
       *
       * Internal use only, replaced for unit tests.
       */
      _newSocket() {
        return new net_1.Socket();
      }
    };
    exports2.FTPContext = FTPContext;
  }
});

// node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/FileInfo.js
var require_FileInfo = __commonJS({
  "node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/FileInfo.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.FileInfo = exports2.FileType = void 0;
    var FileType;
    (function(FileType2) {
      FileType2[FileType2["Unknown"] = 0] = "Unknown";
      FileType2[FileType2["File"] = 1] = "File";
      FileType2[FileType2["Directory"] = 2] = "Directory";
      FileType2[FileType2["SymbolicLink"] = 3] = "SymbolicLink";
    })(FileType || (exports2.FileType = FileType = {}));
    var FileInfo = class {
      constructor(name) {
        this.name = name;
        this.type = FileType.Unknown;
        this.size = 0;
        this.rawModifiedAt = "";
        this.modifiedAt = void 0;
        this.permissions = void 0;
        this.hardLinkCount = void 0;
        this.link = void 0;
        this.group = void 0;
        this.user = void 0;
        this.uniqueID = void 0;
        this.name = name;
      }
      get isDirectory() {
        return this.type === FileType.Directory;
      }
      get isSymbolicLink() {
        return this.type === FileType.SymbolicLink;
      }
      get isFile() {
        return this.type === FileType.File;
      }
      /**
       * Deprecated, legacy API. Use `rawModifiedAt` instead.
       * @deprecated
       */
      get date() {
        return this.rawModifiedAt;
      }
      set date(rawModifiedAt) {
        this.rawModifiedAt = rawModifiedAt;
      }
    };
    exports2.FileInfo = FileInfo;
    FileInfo.UnixPermission = {
      Read: 4,
      Write: 2,
      Execute: 1
    };
  }
});

// node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/parseListDOS.js
var require_parseListDOS = __commonJS({
  "node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/parseListDOS.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.transformList = exports2.parseLine = exports2.testLine = void 0;
    var FileInfo_1 = require_FileInfo();
    var RE_LINE = new RegExp(
      "(\\S+)\\s+(\\S+)\\s+(?:(<DIR>)|([0-9]+))\\s+(\\S.*)"
      // First non-space followed by rest of line (name)
    );
    function testLine(line) {
      return /^\d{2}/.test(line) && RE_LINE.test(line);
    }
    exports2.testLine = testLine;
    function parseLine(line) {
      const groups = line.match(RE_LINE);
      if (groups === null) {
        return void 0;
      }
      const name = groups[5];
      if (name === "." || name === "..") {
        return void 0;
      }
      const file = new FileInfo_1.FileInfo(name);
      const fileType = groups[3];
      if (fileType === "<DIR>") {
        file.type = FileInfo_1.FileType.Directory;
        file.size = 0;
      } else {
        file.type = FileInfo_1.FileType.File;
        file.size = parseInt(groups[4], 10);
      }
      file.rawModifiedAt = groups[1] + " " + groups[2];
      return file;
    }
    exports2.parseLine = parseLine;
    function transformList(files) {
      return files;
    }
    exports2.transformList = transformList;
  }
});

// node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/parseListUnix.js
var require_parseListUnix = __commonJS({
  "node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/parseListUnix.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.transformList = exports2.parseLine = exports2.testLine = void 0;
    var FileInfo_1 = require_FileInfo();
    var JA_MONTH = "\u6708";
    var JA_DAY = "\u65E5";
    var JA_YEAR = "\u5E74";
    var RE_LINE = new RegExp("([bcdelfmpSs-])(((r|-)(w|-)([xsStTL-]))((r|-)(w|-)([xsStTL-]))((r|-)(w|-)([xsStTL-]?)))\\+?\\s*(\\d+)\\s+(?:(\\S+(?:\\s\\S+)*?)\\s+)?(?:(\\S+(?:\\s\\S+)*)\\s+)?(\\d+(?:,\\s*\\d+)?)\\s+((?:\\d+[-/]\\d+[-/]\\d+)|(?:\\S{3}\\s+\\d{1,2})|(?:\\d{1,2}\\s+\\S{3})|(?:\\d{1,2}" + JA_MONTH + "\\s+\\d{1,2}" + JA_DAY + "))\\s+((?:\\d+(?::\\d+)?)|(?:\\d{4}" + JA_YEAR + "))\\s(.*)");
    function testLine(line) {
      return RE_LINE.test(line);
    }
    exports2.testLine = testLine;
    function parseLine(line) {
      const groups = line.match(RE_LINE);
      if (groups === null) {
        return void 0;
      }
      const name = groups[21];
      if (name === "." || name === "..") {
        return void 0;
      }
      const file = new FileInfo_1.FileInfo(name);
      file.size = parseInt(groups[18], 10);
      file.user = groups[16];
      file.group = groups[17];
      file.hardLinkCount = parseInt(groups[15], 10);
      file.rawModifiedAt = groups[19] + " " + groups[20];
      file.permissions = {
        user: parseMode(groups[4], groups[5], groups[6]),
        group: parseMode(groups[8], groups[9], groups[10]),
        world: parseMode(groups[12], groups[13], groups[14])
      };
      switch (groups[1].charAt(0)) {
        case "d":
          file.type = FileInfo_1.FileType.Directory;
          break;
        case "e":
          file.type = FileInfo_1.FileType.SymbolicLink;
          break;
        case "l":
          file.type = FileInfo_1.FileType.SymbolicLink;
          break;
        case "b":
        case "c":
          file.type = FileInfo_1.FileType.File;
          break;
        case "f":
        case "-":
          file.type = FileInfo_1.FileType.File;
          break;
        default:
          file.type = FileInfo_1.FileType.Unknown;
      }
      if (file.isSymbolicLink) {
        const end = name.indexOf(" -> ");
        if (end !== -1) {
          file.name = name.substring(0, end);
          file.link = name.substring(end + 4);
        }
      }
      return file;
    }
    exports2.parseLine = parseLine;
    function transformList(files) {
      return files;
    }
    exports2.transformList = transformList;
    function parseMode(r, w, x) {
      let value = 0;
      if (r !== "-") {
        value += FileInfo_1.FileInfo.UnixPermission.Read;
      }
      if (w !== "-") {
        value += FileInfo_1.FileInfo.UnixPermission.Write;
      }
      const execToken = x.charAt(0);
      if (execToken !== "-" && execToken.toUpperCase() !== execToken) {
        value += FileInfo_1.FileInfo.UnixPermission.Execute;
      }
      return value;
    }
  }
});

// node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/parseListMLSD.js
var require_parseListMLSD = __commonJS({
  "node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/parseListMLSD.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.parseMLSxDate = exports2.transformList = exports2.parseLine = exports2.testLine = void 0;
    var FileInfo_1 = require_FileInfo();
    function parseSize(value, info) {
      info.size = parseInt(value, 10);
    }
    var factHandlersByName = {
      "size": parseSize,
      // File size
      "sizd": parseSize,
      // Directory size
      "unique": (value, info) => {
        info.uniqueID = value;
      },
      "modify": (value, info) => {
        info.modifiedAt = parseMLSxDate(value);
        info.rawModifiedAt = info.modifiedAt.toISOString();
      },
      "type": (value, info) => {
        if (value.startsWith("OS.unix=slink")) {
          info.type = FileInfo_1.FileType.SymbolicLink;
          info.link = value.substr(value.indexOf(":") + 1);
          return 1;
        }
        switch (value) {
          case "file":
            info.type = FileInfo_1.FileType.File;
            break;
          case "dir":
            info.type = FileInfo_1.FileType.Directory;
            break;
          case "OS.unix=symlink":
            info.type = FileInfo_1.FileType.SymbolicLink;
            break;
          case "cdir":
          // Current directory being listed
          case "pdir":
            return 2;
          // Don't include these entries in the listing
          default:
            info.type = FileInfo_1.FileType.Unknown;
        }
        return 1;
      },
      "unix.mode": (value, info) => {
        const digits = value.substr(-3);
        info.permissions = {
          user: parseInt(digits[0], 10),
          group: parseInt(digits[1], 10),
          world: parseInt(digits[2], 10)
        };
      },
      "unix.ownername": (value, info) => {
        info.user = value;
      },
      "unix.owner": (value, info) => {
        if (info.user === void 0)
          info.user = value;
      },
      get "unix.uid"() {
        return this["unix.owner"];
      },
      "unix.groupname": (value, info) => {
        info.group = value;
      },
      "unix.group": (value, info) => {
        if (info.group === void 0)
          info.group = value;
      },
      get "unix.gid"() {
        return this["unix.group"];
      }
      // Regarding the fact "perm":
      // We don't handle permission information stored in "perm" because its information is conceptually
      // different from what users of FTP clients usually associate with "permissions". Those that have
      // some expectations (and probably want to edit them with a SITE command) often unknowingly expect
      // the Unix permission system. The information passed by "perm" describes what FTP commands can be
      // executed with a file/directory. But even this can be either incomplete or just meant as a "guide"
      // as the spec mentions. From https://tools.ietf.org/html/rfc3659#section-7.5.5: "The permissions are
      // described here as they apply to FTP commands. They may not map easily into particular permissions
      // available on the server's operating system." The parser by Apache Commons tries to translate these
      // to Unix permissions – this is misleading users and might not even be correct.
    };
    function splitStringOnce(str, delimiter) {
      const pos = str.indexOf(delimiter);
      const a = str.substr(0, pos);
      const b = str.substr(pos + delimiter.length);
      return [a, b];
    }
    function testLine(line) {
      return /^\S+=\S+;/.test(line) || line.startsWith(" ");
    }
    exports2.testLine = testLine;
    function parseLine(line) {
      const [packedFacts, name] = splitStringOnce(line, " ");
      if (name === "" || name === "." || name === "..") {
        return void 0;
      }
      const info = new FileInfo_1.FileInfo(name);
      const facts = packedFacts.split(";");
      for (const fact of facts) {
        const [factName, factValue] = splitStringOnce(fact, "=");
        if (!factValue) {
          continue;
        }
        const factHandler = factHandlersByName[factName.toLowerCase()];
        if (!factHandler) {
          continue;
        }
        const result = factHandler(factValue, info);
        if (result === 2) {
          return void 0;
        }
      }
      return info;
    }
    exports2.parseLine = parseLine;
    function transformList(files) {
      const nonLinksByID = /* @__PURE__ */ new Map();
      for (const file of files) {
        if (!file.isSymbolicLink && file.uniqueID !== void 0) {
          nonLinksByID.set(file.uniqueID, file);
        }
      }
      const resolvedFiles = [];
      for (const file of files) {
        if (file.isSymbolicLink && file.uniqueID !== void 0 && file.link === void 0) {
          const target = nonLinksByID.get(file.uniqueID);
          if (target !== void 0) {
            file.link = target.name;
          }
        }
        const isPartOfDirectory = !file.name.includes("/");
        if (isPartOfDirectory) {
          resolvedFiles.push(file);
        }
      }
      return resolvedFiles;
    }
    exports2.transformList = transformList;
    function parseMLSxDate(fact) {
      return new Date(Date.UTC(
        +fact.slice(0, 4),
        // Year
        +fact.slice(4, 6) - 1,
        // Month
        +fact.slice(6, 8),
        // Date
        +fact.slice(8, 10),
        // Hours
        +fact.slice(10, 12),
        // Minutes
        +fact.slice(12, 14),
        // Seconds
        +fact.slice(15, 18)
        // Milliseconds
      ));
    }
    exports2.parseMLSxDate = parseMLSxDate;
  }
});

// node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/parseList.js
var require_parseList = __commonJS({
  "node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/parseList.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.parseList = void 0;
    var dosParser = __importStar(require_parseListDOS());
    var unixParser = __importStar(require_parseListUnix());
    var mlsdParser = __importStar(require_parseListMLSD());
    var availableParsers = [
      dosParser,
      unixParser,
      mlsdParser
      // Keep MLSD last, may accept filename only
    ];
    function firstCompatibleParser(line, parsers) {
      return parsers.find((parser) => parser.testLine(line) === true);
    }
    function isNotBlank(str) {
      return str.trim() !== "";
    }
    function isNotMeta(str) {
      return !str.startsWith("total");
    }
    var REGEX_NEWLINE = /\r?\n/;
    function parseList(rawList) {
      const lines = rawList.split(REGEX_NEWLINE).filter(isNotBlank).filter(isNotMeta);
      if (lines.length === 0) {
        return [];
      }
      const testLine = lines[lines.length - 1];
      const parser = firstCompatibleParser(testLine, availableParsers);
      if (!parser) {
        throw new Error("This library only supports MLSD, Unix- or DOS-style directory listing. Your FTP server seems to be using another format. You can see the transmitted listing when setting `client.ftp.verbose = true`. You can then provide a custom parser to `client.parseList`, see the documentation for details.");
      }
      const files = lines.map(parser.parseLine).filter((info) => info !== void 0);
      return parser.transformList(files);
    }
    exports2.parseList = parseList;
  }
});

// node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/ProgressTracker.js
var require_ProgressTracker = __commonJS({
  "node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/ProgressTracker.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ProgressTracker = void 0;
    var ProgressTracker = class {
      constructor() {
        this.bytesOverall = 0;
        this.intervalMs = 500;
        this.onStop = noop;
        this.onHandle = noop;
      }
      /**
       * Register a new handler for progress info. Use `undefined` to disable reporting.
       */
      reportTo(onHandle = noop) {
        this.onHandle = onHandle;
      }
      /**
       * Start tracking transfer progress of a socket.
       *
       * @param socket  The socket to observe.
       * @param name  A name associated with this progress tracking, e.g. a filename.
       * @param type  The type of the transfer, typically "upload" or "download".
       */
      start(socket, name, type) {
        let lastBytes = 0;
        this.onStop = poll(this.intervalMs, () => {
          const bytes = socket.bytesRead + socket.bytesWritten;
          this.bytesOverall += bytes - lastBytes;
          lastBytes = bytes;
          this.onHandle({
            name,
            type,
            bytes,
            bytesOverall: this.bytesOverall
          });
        });
      }
      /**
       * Stop tracking transfer progress.
       */
      stop() {
        this.onStop(false);
      }
      /**
       * Call the progress handler one more time, then stop tracking.
       */
      updateAndStop() {
        this.onStop(true);
      }
    };
    exports2.ProgressTracker = ProgressTracker;
    function poll(intervalMs, updateFunc) {
      const id = setInterval(updateFunc, intervalMs);
      const stopFunc = (stopWithUpdate) => {
        clearInterval(id);
        if (stopWithUpdate) {
          updateFunc();
        }
        updateFunc = noop;
      };
      updateFunc();
      return stopFunc;
    }
    function noop() {
    }
  }
});

// node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/StringWriter.js
var require_StringWriter = __commonJS({
  "node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/StringWriter.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.StringWriter = void 0;
    var stream_1 = require("stream");
    var StringWriter = class extends stream_1.Writable {
      constructor() {
        super(...arguments);
        this.buf = Buffer.alloc(0);
      }
      _write(chunk, _, callback) {
        if (chunk instanceof Buffer) {
          this.buf = Buffer.concat([this.buf, chunk]);
          callback(null);
        } else {
          callback(new Error("StringWriter expects chunks of type 'Buffer'."));
        }
      }
      getText(encoding) {
        return this.buf.toString(encoding);
      }
    };
    exports2.StringWriter = StringWriter;
  }
});

// node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/netUtils.js
var require_netUtils = __commonJS({
  "node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/netUtils.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ipIsPrivateV4Address = exports2.upgradeSocket = exports2.describeAddress = exports2.describeTLS = void 0;
    var tls_1 = require("tls");
    function describeTLS(socket) {
      if (socket instanceof tls_1.TLSSocket) {
        const protocol = socket.getProtocol();
        return protocol ? protocol : "Server socket or disconnected client socket";
      }
      return "No encryption";
    }
    exports2.describeTLS = describeTLS;
    function describeAddress(socket) {
      if (socket.remoteFamily === "IPv6") {
        return `[${socket.remoteAddress}]:${socket.remotePort}`;
      }
      return `${socket.remoteAddress}:${socket.remotePort}`;
    }
    exports2.describeAddress = describeAddress;
    function upgradeSocket(socket, options) {
      return new Promise((resolve, reject) => {
        const tlsOptions = Object.assign({}, options, {
          socket
        });
        const tlsSocket = (0, tls_1.connect)(tlsOptions, () => {
          const expectCertificate = tlsOptions.rejectUnauthorized !== false;
          if (expectCertificate && !tlsSocket.authorized) {
            reject(tlsSocket.authorizationError);
          } else {
            tlsSocket.removeAllListeners("error");
            resolve(tlsSocket);
          }
        }).once("error", (error) => {
          reject(error);
        });
      });
    }
    exports2.upgradeSocket = upgradeSocket;
    function ipIsPrivateV4Address(ip = "") {
      if (ip.startsWith("::ffff:")) {
        ip = ip.substr(7);
      }
      const octets = ip.split(".").map((o) => parseInt(o, 10));
      return octets[0] === 10 || octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31 || octets[0] === 192 && octets[1] === 168 || ip === "127.0.0.1";
    }
    exports2.ipIsPrivateV4Address = ipIsPrivateV4Address;
  }
});

// node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/transfer.js
var require_transfer = __commonJS({
  "node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/transfer.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.downloadTo = exports2.uploadFrom = exports2.connectForPassiveTransfer = exports2.parsePasvResponse = exports2.enterPassiveModeIPv4 = exports2.parseEpsvResponse = exports2.enterPassiveModeIPv6 = void 0;
    var netUtils_1 = require_netUtils();
    var stream_1 = require("stream");
    var tls_1 = require("tls");
    var parseControlResponse_1 = require_parseControlResponse();
    async function enterPassiveModeIPv6(ftp) {
      const res = await ftp.request("EPSV");
      const port = parseEpsvResponse(res.message);
      if (!port) {
        throw new Error("Can't parse EPSV response: " + res.message);
      }
      const controlHost = ftp.socket.remoteAddress;
      if (controlHost === void 0) {
        throw new Error("Control socket is disconnected, can't get remote address.");
      }
      await connectForPassiveTransfer(controlHost, port, ftp);
      return res;
    }
    exports2.enterPassiveModeIPv6 = enterPassiveModeIPv6;
    function parseEpsvResponse(message) {
      const groups = message.match(/[|!]{3}(.+)[|!]/);
      if (groups === null || groups[1] === void 0) {
        throw new Error(`Can't parse response to 'EPSV': ${message}`);
      }
      const port = parseInt(groups[1], 10);
      if (Number.isNaN(port)) {
        throw new Error(`Can't parse response to 'EPSV', port is not a number: ${message}`);
      }
      return port;
    }
    exports2.parseEpsvResponse = parseEpsvResponse;
    async function enterPassiveModeIPv4(ftp) {
      const res = await ftp.request("PASV");
      const target = parsePasvResponse(res.message);
      if (!target) {
        throw new Error("Can't parse PASV response: " + res.message);
      }
      const controlHost = ftp.socket.remoteAddress;
      if ((0, netUtils_1.ipIsPrivateV4Address)(target.host) && controlHost && !(0, netUtils_1.ipIsPrivateV4Address)(controlHost)) {
        target.host = controlHost;
      }
      await connectForPassiveTransfer(target.host, target.port, ftp);
      return res;
    }
    exports2.enterPassiveModeIPv4 = enterPassiveModeIPv4;
    function parsePasvResponse(message) {
      const groups = message.match(/([-\d]+,[-\d]+,[-\d]+,[-\d]+),([-\d]+),([-\d]+)/);
      if (groups === null || groups.length !== 4) {
        throw new Error(`Can't parse response to 'PASV': ${message}`);
      }
      return {
        host: groups[1].replace(/,/g, "."),
        port: (parseInt(groups[2], 10) & 255) * 256 + (parseInt(groups[3], 10) & 255)
      };
    }
    exports2.parsePasvResponse = parsePasvResponse;
    function connectForPassiveTransfer(host, port, ftp) {
      return new Promise((resolve, reject) => {
        let socket = ftp._newSocket();
        const handleConnErr = function(err) {
          err.message = "Can't open data connection in passive mode: " + err.message;
          reject(err);
        };
        const handleTimeout = function() {
          socket.destroy();
          reject(new Error(`Timeout when trying to open data connection to ${host}:${port}`));
        };
        socket.setTimeout(ftp.timeout);
        socket.on("error", handleConnErr);
        socket.on("timeout", handleTimeout);
        socket.connect({ port, host, family: ftp.ipFamily }, () => {
          if (ftp.socket instanceof tls_1.TLSSocket) {
            socket = (0, tls_1.connect)(Object.assign({}, ftp.tlsOptions, {
              socket,
              // Reuse the TLS session negotiated earlier when the control connection
              // was upgraded. Servers expect this because it provides additional
              // security: If a completely new session would be negotiated, a hacker
              // could guess the port and connect to the new data connection before we do
              // by just starting his/her own TLS session.
              session: ftp.socket.getSession()
            }));
          }
          socket.removeListener("error", handleConnErr);
          socket.removeListener("timeout", handleTimeout);
          ftp.dataSocket = socket;
          resolve();
        });
      });
    }
    exports2.connectForPassiveTransfer = connectForPassiveTransfer;
    var TransferResolver = class {
      /**
       * Instantiate a TransferResolver
       */
      constructor(ftp, progress) {
        this.ftp = ftp;
        this.progress = progress;
        this.response = void 0;
        this.dataTransferDone = false;
      }
      /**
       * Mark the beginning of a transfer.
       *
       * @param name - Name of the transfer, usually the filename.
       * @param type - Type of transfer, usually "upload" or "download".
       */
      onDataStart(name, type) {
        if (this.ftp.dataSocket === void 0) {
          throw new Error("Data transfer should start but there is no data connection.");
        }
        this.ftp.socket.setTimeout(0);
        this.ftp.dataSocket.setTimeout(this.ftp.timeout);
        this.progress.start(this.ftp.dataSocket, name, type);
      }
      /**
       * The data connection has finished the transfer.
       */
      onDataDone(task) {
        this.progress.updateAndStop();
        this.ftp.socket.setTimeout(this.ftp.timeout);
        if (this.ftp.dataSocket) {
          this.ftp.dataSocket.setTimeout(0);
        }
        this.dataTransferDone = true;
        this.tryResolve(task);
      }
      /**
       * The control connection reports the transfer as finished.
       */
      onControlDone(task, response) {
        this.response = response;
        this.tryResolve(task);
      }
      /**
       * An error has been reported and the task should be rejected.
       */
      onError(task, err) {
        this.progress.updateAndStop();
        this.ftp.socket.setTimeout(this.ftp.timeout);
        this.ftp.dataSocket = void 0;
        task.reject(err);
      }
      /**
       * Control connection sent an unexpected request requiring a response from our part. We
       * can't provide that (because unknown) and have to close the contrext with an error because
       * the FTP server is now caught up in a state we can't resolve.
       */
      onUnexpectedRequest(response) {
        const err = new Error(`Unexpected FTP response is requesting an answer: ${response.message}`);
        this.ftp.closeWithError(err);
      }
      tryResolve(task) {
        const canResolve = this.dataTransferDone && this.response !== void 0;
        if (canResolve) {
          this.ftp.dataSocket = void 0;
          task.resolve(this.response);
        }
      }
    };
    function uploadFrom(source, config) {
      const resolver = new TransferResolver(config.ftp, config.tracker);
      const fullCommand = `${config.command} ${config.remotePath}`;
      return config.ftp.handle(fullCommand, (res, task) => {
        if (res instanceof Error) {
          resolver.onError(task, res);
        } else if (res.code === 150 || res.code === 125) {
          const dataSocket = config.ftp.dataSocket;
          if (!dataSocket) {
            resolver.onError(task, new Error("Upload should begin but no data connection is available."));
            return;
          }
          const canUpload = "getCipher" in dataSocket ? dataSocket.getCipher() !== void 0 : true;
          onConditionOrEvent(canUpload, dataSocket, "secureConnect", () => {
            config.ftp.log(`Uploading to ${(0, netUtils_1.describeAddress)(dataSocket)} (${(0, netUtils_1.describeTLS)(dataSocket)})`);
            resolver.onDataStart(config.remotePath, config.type);
            (0, stream_1.pipeline)(source, dataSocket, (err) => {
              if (err) {
                resolver.onError(task, err);
              } else {
                resolver.onDataDone(task);
              }
            });
          });
        } else if ((0, parseControlResponse_1.positiveCompletion)(res.code)) {
          resolver.onControlDone(task, res);
        } else if ((0, parseControlResponse_1.positiveIntermediate)(res.code)) {
          resolver.onUnexpectedRequest(res);
        }
      });
    }
    exports2.uploadFrom = uploadFrom;
    function downloadTo(destination, config) {
      if (!config.ftp.dataSocket) {
        throw new Error("Download will be initiated but no data connection is available.");
      }
      const resolver = new TransferResolver(config.ftp, config.tracker);
      return config.ftp.handle(config.command, (res, task) => {
        if (res instanceof Error) {
          resolver.onError(task, res);
        } else if (res.code === 150 || res.code === 125) {
          const dataSocket = config.ftp.dataSocket;
          if (!dataSocket) {
            resolver.onError(task, new Error("Download should begin but no data connection is available."));
            return;
          }
          config.ftp.log(`Downloading from ${(0, netUtils_1.describeAddress)(dataSocket)} (${(0, netUtils_1.describeTLS)(dataSocket)})`);
          resolver.onDataStart(config.remotePath, config.type);
          (0, stream_1.pipeline)(dataSocket, destination, (err) => {
            if (err) {
              resolver.onError(task, err);
            } else {
              resolver.onDataDone(task);
            }
          });
        } else if (res.code === 350) {
          config.ftp.send("RETR " + config.remotePath);
        } else if ((0, parseControlResponse_1.positiveCompletion)(res.code)) {
          resolver.onControlDone(task, res);
        } else if ((0, parseControlResponse_1.positiveIntermediate)(res.code)) {
          resolver.onUnexpectedRequest(res);
        }
      });
    }
    exports2.downloadTo = downloadTo;
    function onConditionOrEvent(condition, emitter, eventName, action) {
      if (condition === true) {
        action();
      } else {
        emitter.once(eventName, () => action());
      }
    }
  }
});

// node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/Client.js
var require_Client = __commonJS({
  "node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/Client.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Client = void 0;
    var fs_1 = require("fs");
    var path_1 = require("path");
    var tls_1 = require("tls");
    var util_1 = require("util");
    var FtpContext_1 = require_FtpContext();
    var parseList_1 = require_parseList();
    var ProgressTracker_1 = require_ProgressTracker();
    var StringWriter_1 = require_StringWriter();
    var parseListMLSD_1 = require_parseListMLSD();
    var netUtils_1 = require_netUtils();
    var transfer_1 = require_transfer();
    var parseControlResponse_1 = require_parseControlResponse();
    var fsReadDir = (0, util_1.promisify)(fs_1.readdir);
    var fsMkDir = (0, util_1.promisify)(fs_1.mkdir);
    var fsStat = (0, util_1.promisify)(fs_1.stat);
    var fsOpen = (0, util_1.promisify)(fs_1.open);
    var fsClose = (0, util_1.promisify)(fs_1.close);
    var fsUnlink = (0, util_1.promisify)(fs_1.unlink);
    var LIST_COMMANDS_DEFAULT = () => ["LIST -a", "LIST"];
    var LIST_COMMANDS_MLSD = () => ["MLSD", "LIST -a", "LIST"];
    var Client2 = class {
      /**
       * Instantiate an FTP client.
       *
       * @param timeout  Timeout in milliseconds, use 0 for no timeout. Optional, default is 30 seconds.
       */
      constructor(timeout = 3e4) {
        this.availableListCommands = LIST_COMMANDS_DEFAULT();
        this.ftp = new FtpContext_1.FTPContext(timeout);
        this.prepareTransfer = this._enterFirstCompatibleMode([transfer_1.enterPassiveModeIPv6, transfer_1.enterPassiveModeIPv4]);
        this.parseList = parseList_1.parseList;
        this._progressTracker = new ProgressTracker_1.ProgressTracker();
      }
      /**
       * Close the client and all open socket connections.
       *
       * Close the client and all open socket connections. The client can’t be used anymore after calling this method,
       * you have to either reconnect with `access` or `connect` or instantiate a new instance to continue any work.
       * A client is also closed automatically if any timeout or connection error occurs.
       */
      close() {
        this.ftp.close();
        this._progressTracker.stop();
      }
      /**
       * Returns true if the client is closed and can't be used anymore.
       */
      get closed() {
        return this.ftp.closed;
      }
      /**
       * Connect (or reconnect) to an FTP server.
       *
       * This is an instance method and thus can be called multiple times during the lifecycle of a `Client`
       * instance. Whenever you do, the client is reset with a new control connection. This also implies that
       * you can reopen a `Client` instance that has been closed due to an error when reconnecting with this
       * method. In fact, reconnecting is the only way to continue using a closed `Client`.
       *
       * @param host  Host the client should connect to. Optional, default is "localhost".
       * @param port  Port the client should connect to. Optional, default is 21.
       */
      connect(host = "localhost", port = 21) {
        this.ftp.reset();
        this.ftp.socket.connect({
          host,
          port,
          family: this.ftp.ipFamily
        }, () => this.ftp.log(`Connected to ${(0, netUtils_1.describeAddress)(this.ftp.socket)} (${(0, netUtils_1.describeTLS)(this.ftp.socket)})`));
        return this._handleConnectResponse();
      }
      /**
       * As `connect` but using implicit TLS. Implicit TLS is not an FTP standard and has been replaced by
       * explicit TLS. There are still FTP servers that support only implicit TLS, though.
       */
      connectImplicitTLS(host = "localhost", port = 21, tlsOptions = {}) {
        this.ftp.reset();
        this.ftp.socket = (0, tls_1.connect)(port, host, tlsOptions, () => this.ftp.log(`Connected to ${(0, netUtils_1.describeAddress)(this.ftp.socket)} (${(0, netUtils_1.describeTLS)(this.ftp.socket)})`));
        this.ftp.tlsOptions = tlsOptions;
        return this._handleConnectResponse();
      }
      /**
       * Handles the first reponse by an FTP server after the socket connection has been established.
       */
      _handleConnectResponse() {
        return this.ftp.handle(void 0, (res, task) => {
          if (res instanceof Error) {
            task.reject(res);
          } else if ((0, parseControlResponse_1.positiveCompletion)(res.code)) {
            task.resolve(res);
          } else {
            task.reject(new FtpContext_1.FTPError(res));
          }
        });
      }
      /**
       * Send an FTP command and handle the first response.
       */
      send(command, ignoreErrorCodesDEPRECATED = false) {
        if (ignoreErrorCodesDEPRECATED) {
          this.ftp.log("Deprecated call using send(command, flag) with boolean flag to ignore errors. Use sendIgnoringError(command).");
          return this.sendIgnoringError(command);
        }
        return this.ftp.request(command);
      }
      /**
       * Send an FTP command and ignore an FTP error response. Any other kind of error or timeout will still reject the Promise.
       *
       * @param command
       */
      sendIgnoringError(command) {
        return this.ftp.handle(command, (res, task) => {
          if (res instanceof FtpContext_1.FTPError) {
            task.resolve({ code: res.code, message: res.message });
          } else if (res instanceof Error) {
            task.reject(res);
          } else {
            task.resolve(res);
          }
        });
      }
      /**
       * Upgrade the current socket connection to TLS.
       *
       * @param options  TLS options as in `tls.connect(options)`, optional.
       * @param command  Set the authentication command. Optional, default is "AUTH TLS".
       */
      async useTLS(options = {}, command = "AUTH TLS") {
        const ret = await this.send(command);
        this.ftp.socket = await (0, netUtils_1.upgradeSocket)(this.ftp.socket, options);
        this.ftp.tlsOptions = options;
        this.ftp.log(`Control socket is using: ${(0, netUtils_1.describeTLS)(this.ftp.socket)}`);
        return ret;
      }
      /**
       * Login a user with a password.
       *
       * @param user  Username to use for login. Optional, default is "anonymous".
       * @param password  Password to use for login. Optional, default is "guest".
       */
      login(user = "anonymous", password = "guest") {
        this.ftp.log(`Login security: ${(0, netUtils_1.describeTLS)(this.ftp.socket)}`);
        return this.ftp.handle("USER " + user, (res, task) => {
          if (res instanceof Error) {
            task.reject(res);
          } else if ((0, parseControlResponse_1.positiveCompletion)(res.code)) {
            task.resolve(res);
          } else if (res.code === 331) {
            this.ftp.send("PASS " + password);
          } else {
            task.reject(new FtpContext_1.FTPError(res));
          }
        });
      }
      /**
       * Set the usual default settings.
       *
       * Settings used:
       * * Binary mode (TYPE I)
       * * File structure (STRU F)
       * * Additional settings for FTPS (PBSZ 0, PROT P)
       */
      async useDefaultSettings() {
        const features = await this.features();
        const supportsMLSD = features.has("MLST");
        this.availableListCommands = supportsMLSD ? LIST_COMMANDS_MLSD() : LIST_COMMANDS_DEFAULT();
        await this.send("TYPE I");
        await this.sendIgnoringError("STRU F");
        await this.sendIgnoringError("OPTS UTF8 ON");
        if (supportsMLSD) {
          await this.sendIgnoringError("OPTS MLST type;size;modify;unique;unix.mode;unix.owner;unix.group;unix.ownername;unix.groupname;");
        }
        if (this.ftp.hasTLS) {
          await this.sendIgnoringError("PBSZ 0");
          await this.sendIgnoringError("PROT P");
        }
      }
      /**
       * Convenience method that calls `connect`, `useTLS`, `login` and `useDefaultSettings`.
       *
       * This is an instance method and thus can be called multiple times during the lifecycle of a `Client`
       * instance. Whenever you do, the client is reset with a new control connection. This also implies that
       * you can reopen a `Client` instance that has been closed due to an error when reconnecting with this
       * method. In fact, reconnecting is the only way to continue using a closed `Client`.
       */
      async access(options = {}) {
        var _a, _b;
        const useExplicitTLS = options.secure === true;
        const useImplicitTLS = options.secure === "implicit";
        let welcome;
        if (useImplicitTLS) {
          welcome = await this.connectImplicitTLS(options.host, options.port, options.secureOptions);
        } else {
          welcome = await this.connect(options.host, options.port);
        }
        if (useExplicitTLS) {
          const secureOptions = (_a = options.secureOptions) !== null && _a !== void 0 ? _a : {};
          secureOptions.host = (_b = secureOptions.host) !== null && _b !== void 0 ? _b : options.host;
          await this.useTLS(secureOptions);
        }
        await this.sendIgnoringError("OPTS UTF8 ON");
        await this.login(options.user, options.password);
        await this.useDefaultSettings();
        return welcome;
      }
      /**
       * Get the current working directory.
       */
      async pwd() {
        const res = await this.send("PWD");
        const parsed = res.message.match(/"(.+)"/);
        if (parsed === null || parsed[1] === void 0) {
          throw new Error(`Can't parse response to command 'PWD': ${res.message}`);
        }
        return parsed[1];
      }
      /**
       * Get a description of supported features.
       *
       * This sends the FEAT command and parses the result into a Map where keys correspond to available commands
       * and values hold further information. Be aware that your FTP servers might not support this
       * command in which case this method will not throw an exception but just return an empty Map.
       */
      async features() {
        const res = await this.sendIgnoringError("FEAT");
        const features = /* @__PURE__ */ new Map();
        if (res.code < 400 && (0, parseControlResponse_1.isMultiline)(res.message)) {
          res.message.split("\n").slice(1, -1).forEach((line) => {
            const entry = line.trim().split(" ");
            features.set(entry[0], entry[1] || "");
          });
        }
        return features;
      }
      /**
       * Set the working directory.
       */
      async cd(path2) {
        const validPath = await this.protectWhitespace(path2);
        return this.send("CWD " + validPath);
      }
      /**
       * Switch to the parent directory of the working directory.
       */
      async cdup() {
        return this.send("CDUP");
      }
      /**
       * Get the last modified time of a file. This is not supported by every FTP server, in which case
       * calling this method will throw an exception.
       */
      async lastMod(path2) {
        const validPath = await this.protectWhitespace(path2);
        const res = await this.send(`MDTM ${validPath}`);
        const date = res.message.slice(4);
        return (0, parseListMLSD_1.parseMLSxDate)(date);
      }
      /**
       * Get the size of a file.
       */
      async size(path2) {
        const validPath = await this.protectWhitespace(path2);
        const command = `SIZE ${validPath}`;
        const res = await this.send(command);
        const size = parseInt(res.message.slice(4), 10);
        if (Number.isNaN(size)) {
          throw new Error(`Can't parse response to command '${command}' as a numerical value: ${res.message}`);
        }
        return size;
      }
      /**
       * Rename a file.
       *
       * Depending on the FTP server this might also be used to move a file from one
       * directory to another by providing full paths.
       */
      async rename(srcPath, destPath) {
        const validSrc = await this.protectWhitespace(srcPath);
        const validDest = await this.protectWhitespace(destPath);
        await this.send("RNFR " + validSrc);
        return this.send("RNTO " + validDest);
      }
      /**
       * Remove a file from the current working directory.
       *
       * You can ignore FTP error return codes which won't throw an exception if e.g.
       * the file doesn't exist.
       */
      async remove(path2, ignoreErrorCodes = false) {
        const validPath = await this.protectWhitespace(path2);
        if (ignoreErrorCodes) {
          return this.sendIgnoringError(`DELE ${validPath}`);
        }
        return this.send(`DELE ${validPath}`);
      }
      /**
       * Report transfer progress for any upload or download to a given handler.
       *
       * This will also reset the overall transfer counter that can be used for multiple transfers. You can
       * also call the function without a handler to stop reporting to an earlier one.
       *
       * @param handler  Handler function to call on transfer progress.
       */
      trackProgress(handler) {
        this._progressTracker.bytesOverall = 0;
        this._progressTracker.reportTo(handler);
      }
      /**
       * Upload data from a readable stream or a local file to a remote file.
       *
       * @param source  Readable stream or path to a local file.
       * @param toRemotePath  Path to a remote file to write to.
       */
      async uploadFrom(source, toRemotePath, options = {}) {
        return this._uploadWithCommand(source, toRemotePath, "STOR", options);
      }
      /**
       * Upload data from a readable stream or a local file by appending it to an existing file. If the file doesn't
       * exist the FTP server should create it.
       *
       * @param source  Readable stream or path to a local file.
       * @param toRemotePath  Path to a remote file to write to.
       */
      async appendFrom(source, toRemotePath, options = {}) {
        return this._uploadWithCommand(source, toRemotePath, "APPE", options);
      }
      /**
       * @protected
       */
      async _uploadWithCommand(source, remotePath, command, options) {
        if (typeof source === "string") {
          return this._uploadLocalFile(source, remotePath, command, options);
        }
        return this._uploadFromStream(source, remotePath, command);
      }
      /**
       * @protected
       */
      async _uploadLocalFile(localPath, remotePath, command, options) {
        const fd = await fsOpen(localPath, "r");
        const source = (0, fs_1.createReadStream)("", {
          fd,
          start: options.localStart,
          end: options.localEndInclusive,
          autoClose: false
        });
        try {
          return await this._uploadFromStream(source, remotePath, command);
        } finally {
          await ignoreError(() => fsClose(fd));
        }
      }
      /**
       * @protected
       */
      async _uploadFromStream(source, remotePath, command) {
        const onError = (err) => this.ftp.closeWithError(err);
        source.once("error", onError);
        try {
          const validPath = await this.protectWhitespace(remotePath);
          await this.prepareTransfer(this.ftp);
          return await (0, transfer_1.uploadFrom)(source, {
            ftp: this.ftp,
            tracker: this._progressTracker,
            command,
            remotePath: validPath,
            type: "upload"
          });
        } finally {
          source.removeListener("error", onError);
        }
      }
      /**
       * Download a remote file and pipe its data to a writable stream or to a local file.
       *
       * You can optionally define at which position of the remote file you'd like to start
       * downloading. If the destination you provide is a file, the offset will be applied
       * to it as well. For example: To resume a failed download, you'd request the size of
       * the local, partially downloaded file and use that as the offset. Assuming the size
       * is 23, you'd download the rest using `downloadTo("local.txt", "remote.txt", 23)`.
       *
       * @param destination  Stream or path for a local file to write to.
       * @param fromRemotePath  Path of the remote file to read from.
       * @param startAt  Position within the remote file to start downloading at. If the destination is a file, this offset is also applied to it.
       */
      async downloadTo(destination, fromRemotePath, startAt = 0) {
        if (typeof destination === "string") {
          return this._downloadToFile(destination, fromRemotePath, startAt);
        }
        return this._downloadToStream(destination, fromRemotePath, startAt);
      }
      /**
       * @protected
       */
      async _downloadToFile(localPath, remotePath, startAt) {
        const appendingToLocalFile = startAt > 0;
        const fileSystemFlags = appendingToLocalFile ? "r+" : "w";
        const fd = await fsOpen(localPath, fileSystemFlags);
        const destination = (0, fs_1.createWriteStream)("", {
          fd,
          start: startAt,
          autoClose: false
        });
        try {
          return await this._downloadToStream(destination, remotePath, startAt);
        } catch (err) {
          const localFileStats = await ignoreError(() => fsStat(localPath));
          const hasDownloadedData = localFileStats && localFileStats.size > 0;
          const shouldRemoveLocalFile = !appendingToLocalFile && !hasDownloadedData;
          if (shouldRemoveLocalFile) {
            await ignoreError(() => fsUnlink(localPath));
          }
          throw err;
        } finally {
          await ignoreError(() => fsClose(fd));
        }
      }
      /**
       * @protected
       */
      async _downloadToStream(destination, remotePath, startAt) {
        const onError = (err) => this.ftp.closeWithError(err);
        destination.once("error", onError);
        try {
          const validPath = await this.protectWhitespace(remotePath);
          await this.prepareTransfer(this.ftp);
          return await (0, transfer_1.downloadTo)(destination, {
            ftp: this.ftp,
            tracker: this._progressTracker,
            command: startAt > 0 ? `REST ${startAt}` : `RETR ${validPath}`,
            remotePath: validPath,
            type: "download"
          });
        } finally {
          destination.removeListener("error", onError);
          destination.end();
        }
      }
      /**
       * List files and directories in the current working directory, or from `path` if specified.
       *
       * @param [path]  Path to remote file or directory.
       */
      async list(path2 = "") {
        const validPath = await this.protectWhitespace(path2);
        let lastError;
        for (const candidate of this.availableListCommands) {
          const command = validPath === "" ? candidate : `${candidate} ${validPath}`;
          await this.prepareTransfer(this.ftp);
          try {
            const parsedList = await this._requestListWithCommand(command);
            this.availableListCommands = [candidate];
            return parsedList;
          } catch (err) {
            const shouldTryNext = err instanceof FtpContext_1.FTPError;
            if (!shouldTryNext) {
              throw err;
            }
            lastError = err;
          }
        }
        throw lastError;
      }
      /**
       * @protected
       */
      async _requestListWithCommand(command) {
        const buffer = new StringWriter_1.StringWriter();
        await (0, transfer_1.downloadTo)(buffer, {
          ftp: this.ftp,
          tracker: this._progressTracker,
          command,
          remotePath: "",
          type: "list"
        });
        const text = buffer.getText(this.ftp.encoding);
        this.ftp.log(text);
        return this.parseList(text);
      }
      /**
       * Remove a directory and all of its content.
       *
       * @param remoteDirPath  The path of the remote directory to delete.
       * @example client.removeDir("foo") // Remove directory 'foo' using a relative path.
       * @example client.removeDir("foo/bar") // Remove directory 'bar' using a relative path.
       * @example client.removeDir("/foo/bar") // Remove directory 'bar' using an absolute path.
       * @example client.removeDir("/") // Remove everything.
       */
      async removeDir(remoteDirPath) {
        return this._exitAtCurrentDirectory(async () => {
          await this.cd(remoteDirPath);
          const absoluteDirPath = await this.pwd();
          await this.clearWorkingDir();
          const dirIsRoot = absoluteDirPath === "/";
          if (!dirIsRoot) {
            await this.cdup();
            await this.removeEmptyDir(absoluteDirPath);
          }
        });
      }
      /**
       * Remove all files and directories in the working directory without removing
       * the working directory itself.
       */
      async clearWorkingDir() {
        for (const file of await this.list()) {
          if (file.isDirectory) {
            await this.cd(file.name);
            await this.clearWorkingDir();
            await this.cdup();
            await this.removeEmptyDir(file.name);
          } else {
            await this.remove(file.name);
          }
        }
      }
      /**
       * Upload the contents of a local directory to the remote working directory.
       *
       * This will overwrite existing files with the same names and reuse existing directories.
       * Unrelated files and directories will remain untouched. You can optionally provide a `remoteDirPath`
       * to put the contents inside a directory which will be created if necessary including all
       * intermediate directories. If you did provide a remoteDirPath the working directory will stay
       * the same as before calling this method.
       *
       * @param localDirPath  Local path, e.g. "foo/bar" or "../test"
       * @param [remoteDirPath]  Remote path of a directory to upload to. Working directory if undefined.
       */
      async uploadFromDir(localDirPath, remoteDirPath) {
        return this._exitAtCurrentDirectory(async () => {
          if (remoteDirPath) {
            await this.ensureDir(remoteDirPath);
          }
          return await this._uploadToWorkingDir(localDirPath);
        });
      }
      /**
       * @protected
       */
      async _uploadToWorkingDir(localDirPath) {
        const files = await fsReadDir(localDirPath);
        for (const file of files) {
          const fullPath = (0, path_1.join)(localDirPath, file);
          const stats = await fsStat(fullPath);
          if (stats.isFile()) {
            await this.uploadFrom(fullPath, file);
          } else if (stats.isDirectory()) {
            await this._openDir(file);
            await this._uploadToWorkingDir(fullPath);
            await this.cdup();
          }
        }
      }
      /**
       * Download all files and directories of the working directory to a local directory.
       *
       * @param localDirPath  The local directory to download to.
       * @param remoteDirPath  Remote directory to download. Current working directory if not specified.
       */
      async downloadToDir(localDirPath, remoteDirPath) {
        return this._exitAtCurrentDirectory(async () => {
          if (remoteDirPath) {
            await this.cd(remoteDirPath);
          }
          return await this._downloadFromWorkingDir(localDirPath);
        });
      }
      /**
       * @protected
       */
      async _downloadFromWorkingDir(localDirPath) {
        await ensureLocalDirectory(localDirPath);
        for (const file of await this.list()) {
          const localPath = (0, path_1.join)(localDirPath, file.name);
          if (file.isDirectory) {
            await this.cd(file.name);
            await this._downloadFromWorkingDir(localPath);
            await this.cdup();
          } else if (file.isFile) {
            await this.downloadTo(localPath, file.name);
          }
        }
      }
      /**
       * Make sure a given remote path exists, creating all directories as necessary.
       * This function also changes the current working directory to the given path.
       */
      async ensureDir(remoteDirPath) {
        if (remoteDirPath.startsWith("/")) {
          await this.cd("/");
        }
        const names = remoteDirPath.split("/").filter((name) => name !== "");
        for (const name of names) {
          await this._openDir(name);
        }
      }
      /**
       * Try to create a directory and enter it. This will not raise an exception if the directory
       * couldn't be created if for example it already exists.
       * @protected
       */
      async _openDir(dirName) {
        await this.sendIgnoringError("MKD " + dirName);
        await this.cd(dirName);
      }
      /**
       * Remove an empty directory, will fail if not empty.
       */
      async removeEmptyDir(path2) {
        const validPath = await this.protectWhitespace(path2);
        return this.send(`RMD ${validPath}`);
      }
      /**
       * FTP servers can't handle filenames that have leading whitespace. This method transforms
       * a given path to fix that issue for most cases.
       */
      async protectWhitespace(path2) {
        if (!path2.startsWith(" ")) {
          return path2;
        }
        const pwd = await this.pwd();
        const absolutePathPrefix = pwd.endsWith("/") ? pwd : pwd + "/";
        return absolutePathPrefix + path2;
      }
      async _exitAtCurrentDirectory(func) {
        const userDir = await this.pwd();
        try {
          return await func();
        } finally {
          if (!this.closed) {
            await ignoreError(() => this.cd(userDir));
          }
        }
      }
      /**
       * Try all available transfer strategies and pick the first one that works. Update `client` to
       * use the working strategy for all successive transfer requests.
       *
       * @returns a function that will try the provided strategies.
       */
      _enterFirstCompatibleMode(strategies) {
        return async (ftp) => {
          ftp.log("Trying to find optimal transfer strategy...");
          let lastError = void 0;
          for (const strategy of strategies) {
            try {
              const res = await strategy(ftp);
              ftp.log("Optimal transfer strategy found.");
              this.prepareTransfer = strategy;
              return res;
            } catch (err) {
              lastError = err;
            }
          }
          throw new Error(`None of the available transfer strategies work. Last error response was '${lastError}'.`);
        };
      }
      /**
       * DEPRECATED, use `uploadFrom`.
       * @deprecated
       */
      async upload(source, toRemotePath, options = {}) {
        this.ftp.log("Warning: upload() has been deprecated, use uploadFrom().");
        return this.uploadFrom(source, toRemotePath, options);
      }
      /**
       * DEPRECATED, use `appendFrom`.
       * @deprecated
       */
      async append(source, toRemotePath, options = {}) {
        this.ftp.log("Warning: append() has been deprecated, use appendFrom().");
        return this.appendFrom(source, toRemotePath, options);
      }
      /**
       * DEPRECATED, use `downloadTo`.
       * @deprecated
       */
      async download(destination, fromRemotePath, startAt = 0) {
        this.ftp.log("Warning: download() has been deprecated, use downloadTo().");
        return this.downloadTo(destination, fromRemotePath, startAt);
      }
      /**
       * DEPRECATED, use `uploadFromDir`.
       * @deprecated
       */
      async uploadDir(localDirPath, remoteDirPath) {
        this.ftp.log("Warning: uploadDir() has been deprecated, use uploadFromDir().");
        return this.uploadFromDir(localDirPath, remoteDirPath);
      }
      /**
       * DEPRECATED, use `downloadToDir`.
       * @deprecated
       */
      async downloadDir(localDirPath) {
        this.ftp.log("Warning: downloadDir() has been deprecated, use downloadToDir().");
        return this.downloadToDir(localDirPath);
      }
    };
    exports2.Client = Client2;
    async function ensureLocalDirectory(path2) {
      try {
        await fsStat(path2);
      } catch (err) {
        await fsMkDir(path2, { recursive: true });
      }
    }
    async function ignoreError(func) {
      try {
        return await func();
      } catch (err) {
        return void 0;
      }
    }
  }
});

// node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/StringEncoding.js
var require_StringEncoding = __commonJS({
  "node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/StringEncoding.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/index.js
var require_dist = __commonJS({
  "node_modules/.pnpm/basic-ftp@5.0.5/node_modules/basic-ftp/dist/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.enterPassiveModeIPv6 = exports2.enterPassiveModeIPv4 = void 0;
    __exportStar(require_Client(), exports2);
    __exportStar(require_FtpContext(), exports2);
    __exportStar(require_FileInfo(), exports2);
    __exportStar(require_parseList(), exports2);
    __exportStar(require_StringEncoding(), exports2);
    var transfer_1 = require_transfer();
    Object.defineProperty(exports2, "enterPassiveModeIPv4", { enumerable: true, get: function() {
      return transfer_1.enterPassiveModeIPv4;
    } });
    Object.defineProperty(exports2, "enterPassiveModeIPv6", { enumerable: true, get: function() {
      return transfer_1.enterPassiveModeIPv6;
    } });
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => autoVersionPlugin
});
module.exports = __toCommonJS(src_exports);
var import_node_path = __toESM(require("path"), 1);
var import_node_fs = __toESM(require("fs"), 1);
var import_basic_ftp = __toESM(require_dist(), 1);
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
  const { enable, threshold = 100 } = __options.updateVersion || {};
  return {
    name: "vite-plugin-after-build",
    buildStart() {
      if (enable) {
        const pkg = JSON.parse(import_node_fs.default.readFileSync(pkgPath, "utf-8"));
        oldVersion = pkg.version;
        newVersion = incrementVersion(pkg.version, threshold);
        pkg.version = newVersion;
        import_node_fs.default.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf-8");
      }
    },
    async buildEnd(error) {
      if (!error) {
        buildSuccessful = true;
      } else {
        buildSuccessful = false;
      }
    },
    async closeBundle() {
      if (enable) {
        log(`Version update succeed! ${oldVersion} -> ${newVersion}`);
      }
      if (buildSuccessful) {
        await Promise.all([
          gitCommit(__options.gitCommit || { enable: false }),
          ftpUpload(__options.ftpUpload || { enable: false })
        ]);
      }
      if (enable && !buildSuccessful && oldVersion !== "") {
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
