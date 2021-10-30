import HttpMitmProxy from "http-mitm-proxy";
import send from "send";
import path from "path";
import fs from "fs-extra";
import { parseDomain, ParseResultType } from "parse-domain";

import { SSL_CERT_ROOT_PATH } from "./constant.js";
import { Shell } from "../public/Shell.js";

export class Proxy {
  constructor() {
    this.shell = new Shell();

    this.PORT = process.env.PORT || 8081;
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
    const PATH_fileMap = this.getFileMapPath(args.map);
    const PATH_fileMapDir = path.dirname(PATH_fileMap);

    let fileMap;
    try {
      fileMap = await fs.readFile(PATH_fileMap);
      fileMap = JSON.parse(fileMap);
    } catch (err) {
      console.log("file is not right: " + PATH_fileMap, err);
      return;
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

    return new Promise((resolve, reject) => {
      http_mitm_proxy.listen(
        {
          port: this.PORT,
          sslCaDir: this.SSL_CA_DIR,
        },
        function () {
          console.log("port", port);
        }
      );
    });
  }
}
