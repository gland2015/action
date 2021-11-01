import HttpMitmProxy from "http-mitm-proxy";
import send from "send";
import path from "path";
import fs from "fs-extra";
import { parseDomain, ParseResultType } from "parse-domain";
import SocksProxyAgent from "socks-proxy-agent";
import HttpProxyAgent from "http-proxy-agent";

import { SSL_CERT_ROOT_PATH, HTTP_MITM_PROXY_PORT } from "./constant.js";
import { Shell } from "../public/Shell.js";
import { isFileExist } from "./utils.js";

export class Proxy {
  constructor() {
    this.shell = new Shell();

    this.PORT = process.env.PORT || HTTP_MITM_PROXY_PORT;
    this.SSL_CA_DIR = path.resolve(SSL_CERT_ROOT_PATH, "./.http-mitm-proxy");
    this.PATH_CA_PEM = path.resolve(SSL_CERT_ROOT_PATH, "RootCA.pem");
    this.PATH_CA_KEY = path.resolve(SSL_CERT_ROOT_PATH, "RootCA.key");
  }

  async getFileMapPath(filepath) {
    let result;
    if (filepath) {
      if (path.isAbsolute(filepath)) {
        result = filepath;
      } else {
        result = path.resolve(process.cwd(), filepath);
      }
      let statfile = await fs.stat(result);
      if (!statfile.isFile()) {
        result = path.resolve(result, "fileMap.json");
      }
    } else {
      result = path.resolve(process.cwd(), "./fileMap.json");
    }
    return result;
  }

  parseHostname(hostname) {
    const domainInfo = parseDomain(hostname);
    if (domainInfo.type === ParseResultType.Listed) {
      const baseDomain = [
        ...domainInfo.subDomains.slice(1),
        domainInfo.domain,
        ...domainInfo.topLevelDomains,
      ].join(".");

      return {
        basename: "-." + hostname,
        hosts: ["*." + baseDomain, baseDomain],
      };
    } else if (domainInfo.type == ParseResultType.Ip) {
      return {
        basename: hostname,
        ips: [hostname],
      };
    } else {
      return {
        basename: hostname,
        hosts: [hostname],
      };
    }
  }

  async exec(args) {
    if (!(await isFileExist(this.PATH_CA_PEM))) {
      console.log("PATH_CA_PEM is not exist: " + this.PATH_CA_PEM);
      return;
    }

    if (!(await isFileExist(this.PATH_CA_KEY))) {
      console.log("PATH_CA_KEY is not exist: " + this.PATH_CA_KEY);
      return;
    }

    const PATH_fileMap = this.getFileMapPath(args.map);
    const PATH_fileMapDir = path.dirname(PATH_fileMap);

    let fileMap;
    try {
      fileMap = await fs.readFile(PATH_fileMap);
      fileMap = JSON.parse(fileMap);
    } catch (err) {
      console.log("filemap is not right: " + PATH_fileMap, err.message);
      console.log("continue not use filemap");
      fileMap = {};
    }

    const http_mitm_proxy = HttpMitmProxy();
    http_mitm_proxy.onError(function (ctx, err, errorKind) {});
    http_mitm_proxy.onRequest((ctx, callback) => {
      const req = ctx.clientToProxyRequest;
      const url = `http${ctx.isSSL ? "s" : ""}://` + req.headers.host + req.url;

      const proxyFile = fileMap[url];

      console.log("------url-------" + url + "------url------", !!proxyFile);

      if (proxyFile) {
        let filePath;
        if (path.isAbsolute(proxyFile)) {
          filePath = proxyFile;
        } else {
          filePath = path.join(PATH_fileMapDir, proxyFile);
        }
        const res = ctx.proxyToClientResponse;
        const file = send(req, encodeURI(filePath), {});
        file.pipe(res);
        return;
      }
      callback();
    });

    http_mitm_proxy.onCertificateRequired = (hostname, callback) => {
      const { hosts, basename } = this.parseHostname(hostname);

      const result = {
        hosts,
        keyFile: path.resolve(
          SSL_CERT_ROOT_PATH,
          `sub_cert_${basename}/${basename}.key`
        ),
        certFile: path.resolve(
          SSL_CERT_ROOT_PATH,
          `sub_cert_${basename}/${basename}.crt`
        ),
      };

      return callback(null, result);
    };

    http_mitm_proxy.onCertificateMissing = async (ctx, files, callback) => {
      const { hosts, ips, basename } = this.parseHostname(hostname);

      const outDir = path.dirname(ctx.files.keyFile);
      await this.shell.GenSSLSubCert(
        hosts,
        ips,
        outDir,
        basename,
        this.PATH_CA_PEM,
        this.PATH_CA_KEY
      );

      const result = {
        keyFileData: (await fs.readFile(ctx.files.keyFile)).toString(),
        certFileData: (await fs.readFile(ctx.files.certFile)).toString(),
      };
      return callback(null, result);
    };

    http_mitm_proxy.onResponseEnd(function (ctx, callback) {
      const req = ctx.clientToProxyRequest;
      const url = `http${ctx.isSSL ? "s" : ""}://` + req.headers.host + req.url;

      // todo
      console.log("------url-------" + url + "------url------", ctx);
      return callback();
    });

    return new Promise((resolve, reject) => {
      let agent = null;
      let PROXY_NEXT =
        process.env.HTTP_PROXY ||
        process.env.SOCKS_PROXY ||
        process.env.ALL_PROXY ||
        process.env.HTTPS_PROXY;
      if (PROXY_NEXT) {
        if (PROXY_NEXT.match(/^http/)) {
          console.log("use HTTP_PROXY " + PROXY_NEXT);
          agent = new HttpProxyAgent(PROXY_NEXT);
        } else if (PROXY_NEXT.match(/^socks/)) {
          PROXY_NEXT = PROXY_NEXT.replace(/^socks5\:/, "socks:");
          console.log("use SOCKS_PROXY " + PROXY_NEXT);
          agent = new SocksProxyAgent(PROXY_NEXT);
        } else {
          throw new Error("unknown proxy: " + PROXY_NEXT);
        }
      }

      http_mitm_proxy.listen(
        {
          port: this.PORT,
          sslCaDir: this.SSL_CA_DIR,
          forceSNI: true,
          httpAgent: agent,
          httpsAgent: agent,
        },
        function () {
          console.log("port", port);
        }
      );
    });
  }
}
