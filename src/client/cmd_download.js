import fs from "fs-extra";
import fetch from "node-fetch";
import SocksProxyAgent from "socks-proxy-agent";
import HttpProxyAgent from "http-proxy-agent";

import { isFileExist } from "./utils.js";

export class Download {
  constructor() {}

  // https://cdn.stubdownloader.services.mozilla.com/builds/firefox-stub/en-US/win/b2b7944c6fed1b91a97ca9198cddf6ffb43396b4c28c88348a3b3e23dee2f163/Firefox%20Installer.exe
  async exec(args) {
    const URL = args.URL;
    const outFile = args.outFile || "./outFile";

    if (!URL) {
      throw new Error("please input URL");
    }

    let pathExist = await isFileExist(outFile);
    if (pathExist) {
      throw new Error("the path exist file: " + outFile);
    }

    let agent = null;
    let PROXY =
      process.env.HTTP_PROXY ||
      process.env.SOCKS_PROXY ||
      process.env.ALL_PROXY ||
      process.env.HTTPS_PROXY;
    PROXY = PROXY ? PROXY.trim() : "";
    if (PROXY) {
      if (PROXY.match(/^http/)) {
        console.log("use HTTP_PROXY " + PROXY);
        agent = new HttpProxyAgent(PROXY);
      } else if (PROXY.match(/^socks/)) {
        PROXY = PROXY.replace(/^socks5\:/, "socks:");
        console.log("use SOCKS_PROXY " + PROXY);
        agent = new SocksProxyAgent(PROXY);
      } else {
        throw new Error("unknown proxy: " + PROXY);
      }
    }

    await fetch(URL, {
      method: "get",
      agent,
    })
      .then((res) => {
        return res.buffer();
      })
      .then((buf) => {
        return fs.writeFile(outFile, buf);
      });
  }
}
