import path from "path";
import fs from "fs-extra";
import child_process from "child_process";

import { prompt } from "./utils.js";
import { EnvContent } from "./constant.js";

class Setenv {
  constructor() {
    this.content = EnvContent;
  }

  select() {
    const envList = tihs.content.map((o) => o.name);
    return prompt([
      {
        type: "list",
        name: "value",
        message: "Please select from below:",
        choices: envList,
      },
    ]).then((data) => {
      return this.exec(data.value);
    });
  }

  async exec(name) {
    if (!name) {
      return this.select();
    }
    let target = this.content.find((o) => o.name === name);
    if (!target) {
      console.log(`env "${name}" not found.`);
      return this.select();
    }

    
  }
}
