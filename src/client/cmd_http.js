import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  ACT_SESSION_TYPE,
  SSL_CERT_ROOT_PATH,
  HTTP_SERVER_PORT,
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

    let port = HTTP_SERVER_PORT;
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
      commandStr += ` --ssl --cert "${path.resolve(
        SSL_CERT_ROOT_PATH,
        "./sub_cert_localhost/localhost.crt"
      )}" --key "${path.resolve(
        SSL_CERT_ROOT_PATH,
        "./sub_cert_localhost/localhost.key"
      )}"`;
    }

    await this.socket.SetProcessCommand(commandStr);
  }
}
