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

    const { vhdfile, parents } = this.diskHelper.findVhdFileByName(name);
    if (!vhdfile) {
      console.log(`vhdfile "${name}" not found`);
      return this.select();
    }

    let diskLetter;
    try {
      diskLetter = await this.diskBase.getDiskLetterByList(parents);
    } catch (errData) {
      diskLetter = null;
      if (errData.type === ActionType.SHOW_MESSAGE) {
        return console.log(errData.message);
      }
      console.log(errData);
    }
    if (!diskLetter) {
      return console.log(`"${name}" diskLetter not found, check config file.`);
    }

    const relPath = path.resolve(diskLetter + ":/", vhdfile.filepath);
    const isExist = await fs.pathExists(relPath);

    if (!isExist) {
      return console.log(
        "path is not exist: " + relPath + ", please check config file"
      );
    }

    return await this.diskBase.loadVhdDisk(relPath);
  }
}
