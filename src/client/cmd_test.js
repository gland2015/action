import { Shell } from "../public/Shell.js";
import { URL } from "url";
import { parseDomain, ParseResultType } from "parse-domain";

export class Test {
  constructor() {
    this.shell = new Shell();
  }

  async exec() {
    let r = await this.shell.GetProcessByPort(252);
    console.log(r);
  }
}
