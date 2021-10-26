import path from "path";
import fs from "fs-extra";

import { prompt } from "./utils.js";
import { DiskBase } from "./diskBase.js";
import { DiskHelper } from "./diskHelper.js";
import { ActionType } from "./constant.js";

export class Vhd {
  constructor() {
    this.diskBase = new DiskBase();
    this.diskHelper = new DiskHelper();
  }

  select() {
    const vhdList = this.diskHelper.getVhdFileNames();
    return prompt([
      {
        type: "list",
        name: "value",
        message: `Please select from below:`,
        choices: vhdList,
      },
    ]).then((data) => {
      return this.exec(data.value);
    });
  }

  async exec(name) {
    if (!name) {
      return this.select();
    }

    const { value, parents } = this.diskHelper.findVhdFileByName(name);
    if (!value) {
      console.log(`vhdfile "${name}" not found.`);
      return this.select();
    }
    let rootPath;
    try {
      rootPath = await this.diskBase.getRootPathBy(parents);
    } catch (errData) {
      rootPath = null;
      if (errData.type === ActionType.SHOW_MESSAGE) {
        return console.log(errData.message);
      }
    }
    if (!rootPath) {
      return console.log(`"${name}" rootPath not found, check config file.`);
    }

    const relPath = path.resolve(rootPath, value.filepath);
    const isExist = await fs.pathExists(relPath);

    if (!isExist) {
      return console.log(
        "path is not exist: " + relPath + ", please check config file"
      );
    }
    return await this.diskBase.loadVhdDisk(relPath);
  }
}
