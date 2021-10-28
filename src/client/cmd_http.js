import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  ACT_SESSION_TYPE,
  SSL_CERT_PATH,
  SSL_KEY_PATH,
} from "./constant.js";
import { getSocket } from "./socket.js";

export class Http {
  constructor() {
    this.socket = getSocket();
  }

  async exec(args) {
    let serverPath;
    if (args.dir) {
      if (path.isAbsolute(args.dir)) {
        serverPath = args.dir;
      } else {
        serverPath = path.resolve(process.cwd(), args.dir);
      }
    } else {
      serverPath = process.cwd();
    }

    let isVaild = fs.existsSync(serverPath);
    if (!isVaild) {
      console.log("path is not exist: " + serverPath);
      return;
    }

    let port = "8790";
    if (args.port && args.port.match(/^\d+$/)) {
      port = args.port;
    }

    let scriptPath = "";
    if (ACT_SESSION_TYPE === "PowerShell") {
      scriptPath = path.resolve(
        __dirname,
        "../../node_modules/.bin/http-server.ps1"
      );
    } else {
      scriptPath = path.resolve(
        __dirname,
        "../../node_modules/.bin/http-server.bat"
      );
    }

    let commandStr = `${scriptPath} "${serverPath}" --port ${port}`;

    if (args.proxy) {
      commandStr += ` --proxy "${proxy}"`;
    }

    if (args.https) {
      commandStr += ` --ssl --cert "${SSL_CERT_PATH}" --key "${SSL_KEY_PATH}"`;
    }

    await this.socket.SetProcessCommand(commandStr);
  }
}
