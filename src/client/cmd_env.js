import { prompt } from "./utils.js";
import { EnvContent, ACT_SESSION_TYPE } from "./constant.js";
import { getSocket } from "./socket.js";

export class Env {
  constructor() {
    this.content = EnvContent;
    this.socket = getSocket();
  }

  select() {
    const envList = this.content.map((o) => o.name);
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

    const { setValue, addValue } = target;
    const cmdList = [];

    for (let key in setValue) {
      const value = setValue[key];
      if (ACT_SESSION_TYPE === "CommandPrompt") {
        cmdList.push(`set ${key}=${value}`);
      } else if (ACT_SESSION_TYPE === "PowerShell") {
        cmdList.push(`$Env:${key}=${value}`);
      }
    }

    for (let key in addValue) {
      const valueList = addValue[key];
      let currentValue = (process.env[key] || "").trim();
      let addChar = "";
      const isEndWithSem = /\;$/.test(currentValue);
      if (!isEndWithSem) {
        currentValue = currentValue + ";";
        addChar = ";";
      }

      const appendList = valueList.filter(function (value) {
        if (currentValue.indexOf(value + ";") === -1) {
          return true;
        }
        return false;
      });

      if (appendList.length) {
        if (ACT_SESSION_TYPE === "CommandPrompt") {
          cmdList.push(`set ${key}=%${key}%${addChar}${appendList.join(";")}`);
        } else if (ACT_SESSION_TYPE === "PowerShell") {
          cmdList.push(`$Env:${key}+="${addChar}${appendList.join(";")}"`);
        }
      }
    }

    await this.socket.SetProcessCommand(cmdList.join("\n"));
  }
}
