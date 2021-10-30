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
  }

  async exec(args) {
    const port = process.env.PORT || 8081;
    const sslCaDir = path.resolve(SSL_CERT_ROOT_PATH, "./.http-mitm-proxy");

    let filemapfile;
    let filemapdir;
    if (args.map) {
      if (path.isAbsolute(args.map)) {
        filemapfile = args.map;
      } else {
        filemapfile = path.resolve(process.cwd(), args.map);
      }
      let isExist = await fs.pathExists(filemapfile);
      if (!isExist) {
        throw new Error("path is not exist: " + filemapfile);
      }
      let statfile = await fs.stat(filemapfile);
      if (statfile.isDirectory()) {
        filemapfile = path.resolve(filemapfile, "fileMap.json");
      }
    } else {
      filemapfile = path.resolve(process.cwd(), "./fileMap.json");
    }
    filemapdir = path.dirname(filemapfile);

    let fileMap;
    try {
      fileMap = await fs.readFile(filemapfile);
      fileMap = JSON.parse(fileMap);
    } catch (err) {
      console.log("file is not right: " + filemapfile, err);
      return;
    }

    const http_mitm_proxy = HttpMitmProxy();

    http_mitm_proxy.onError(function (ctx, err, errorKind) {});
    http_mitm_proxy.onRequest((ctx, callback) => {
      const request = ctx.clientToProxyRequest;
      const url =
        (ctx.isSSL ? "https://" : "http://") +
        request.headers.host +
        request.url;
      const needProxy = !!fileMap[url];
      console.log("------url--------" + url + "------url--------", needProxy);
      if (needProxy) {
        let filePath;
        if (path.isAbsolute(fileMap[url])) {
          filePath = fileMap[url];
        } else {
          filePath = path.join(filemapdir, fileMap[url]);
          const response = ctx.proxyToClientResponse;
          const file = send(request, encodeURI(filePath), {});
          file.pipe(response);
          return;
        }
      }
      callback();
    });

    http_mitm_proxy.onCertificateRequired = (hostname, callback) => {
      const result = {};

      let basename = hostname;
      const domainInfo = parseDomain(hostname);
      if (domainInfo.type === ParseResultType.Listed) {
        hostname = [
          ...domainInfo.subDomains.slice(1),
          domainInfo.domain,
          ...domainInfo.topLevelDomains,
        ].join(".");
        result.hosts = ["*." + hostname, hostname];
        basename = "-." + hostname;
      }

      result.keyFile = path.resolve(
        SSL_CERT_ROOT_PATH,
        `sub_cert_${basename}/${basename}.key`
      );
      result.certFile = path.resolve(
        SSL_CERT_ROOT_PATH,
        `sub_cert_${basename}/${basename}.crt`
      );

      return callback(null, result);
    };

    const ca_pem_path = path.resolve(SSL_CERT_ROOT_PATH, "RootCA.pem");
    const ca_key_path = path.resolve(SSL_CERT_ROOT_PATH, "RootCA.key");
    http_mitm_proxy.onCertificateMissing = async (ctx, files, callback) => {
      // console.log('Looking for "%s" certificates', ctx.hostname);
      // console.log('"%s" missing', ctx.files.keyFile);
      // console.log('"%s" missing', ctx.files.certFile);
      const result = {};

      const domains = [];
      const ips = [];

      let hostname = ctx.hostname;
      let basename = hostname;
      const domainInfo = parseDomain(hostname);
      if (domainInfo.type === ParseResultType.Listed) {
        hostname = [
          ...domainInfo.subDomains.slice(1),
          domainInfo.domain,
          ...domainInfo.topLevelDomains,
        ].join(".");
        domains.push("*." + hostname, hostname);
        result.hosts = ["*." + hostname, hostname];
        basename = "-." + hostname;
      } else if (domainInfo.type === ParseResultType.Ip) {
        ips.push(hostname);
      } else {
        domains.push(hostname);
      }

      let outDir = path.dirname(ctx.files.keyFile);

      await this.shell.GenSSLSubCert(
        domains,
        ips,
        outDir,
        basename,
        ca_pem_path,
        ca_key_path
      );

      result.keyFileData = (await fs.readFile(ctx.files.keyFile)).toString();
      result.certFileData = (await fs.readFile(ctx.files.certFile)).toString();

      return callback(null, result);
    };

    return new Promise((resolve, reject) => {
      http_mitm_proxy.listen(
        {
          port,
          sslCaDir,
        },
        function () {
          console.log("port", port);
        }
      );
    });
  }
}
