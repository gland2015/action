import path from "path";
import fs from "fs-extra";

import { prompt } from "./utils.js";
import { DiskBase } from "./diskBase.js";
import { DiskHelper } from "./diskHelper.js";
import { ActionType } from "./constant.js";

export class Code {
  constructor() {
    this.diskBase = new DiskBase();
    this.diskHelper = new DiskHelper();
  }

  select() {
    const projectList = this.diskHelper.getProjectNames();
    return prompt([
      {
        type: "list",
        name: "value",
        message: `Please select from below:`,
        choices: projectList,
      },
    ]).then((data) => {
      return this.exec(data.value);
    });
  }

  async exec(name) {
    if (!name) {
      return this.select();
    }

    const { project, parents } = this.diskHelper.findProjectByName(name);
    if (!project) {
      console.log(`Vscode project "${name}" not found`);
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
      console.log("ddd", errData);
    }

    if (!diskLetter)
      return console.log(`"${name}" diskLetter not found, check config file`);

    const relPath = path.resolve(diskLetter + ":/", project.filepath);
    const isExist = await fs.pathExists(relPath);

    if (!isExist) {
      console.log(
        "path is not exist: " + relPath + ", please check config file"
      );
      return;
    }

    return new Promise(function (resolve, reject) {
      child_process.exec(`code "${relPath}"`, function (error, stdout, stderr) {
        resolve();
      });
    });
  }
}
