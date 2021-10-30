import { Shell } from "../public/Shell.js";
import { URL } from "url";
import { parseDomain, ParseResultType } from "parse-domain"

export class Test {
  constructor() {
    this.shell = new Shell();
  }

  async exec() {
    console.log(parseDomain("1080:0:0:0:8:800:200C:417A"));
    console.log(parseDomain("192.168.1.1"));
    console.log(parseDomain("www.google.com.cn"));
    // await this.shell.GenSSLRootCA("./");
    // await this.shell.GenSSLSubCert(["*.www.google.com"], [], "./www.google.com", "www.google.com", "./", "./RootCA.pem", "./RootCA.key");
  }
}
