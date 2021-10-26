import path from "path";
import fs from "fs-extra";
import child_process from "child_process";

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

    const { value, parents } = this.diskHelper.findProjectByName(name);
    if (!value) {
      console.log(`Vscode project "${name}" not found.`);
      return this.select();
    }

    let rootPath;
    try {
      rootPath = await this.diskBase.getRootPathBy(parents);
    } catch (errData) {
      rootPath = null;
      if (errData.type === ActionType.SHOW_MESSAGE) {
        console.log("Error SHOW_MESSAGE:");
        return console.log(errData.message);
      }
    }

    if (!rootPath) {
      return console.log(`"${name}" rootPath not found, check config file`);
    }

    const relPath = path.resolve(rootPath + ":/", value.filepath);
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
