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

    const { toSet, toAdd } = target;
    const cmdList = [];

    for (let key in toSet) {
      const value = toSet[key];
      if (process.env[key] !== value) {
        if (ACT_SESSION_TYPE === "CommandPrompt") {
          cmdList.push(`set ${key}=${value}`);
        } else if (ACT_SESSION_TYPE === "PowerShell") {
          cmdList.push(`$Env:${key}="${value}"`);
        }
      }
    }

    for (let key in toAdd) {
      const valueList = toAdd[key];
      let curValue = (process.env[key] || "").trim();
      let addChar = "";
      const isEndWithSem = /\;$/.test(curValue);
      if (!isEndWithSem && curValue) {
        curValue = curValue + ";";
        addChar = ";";
      }

      const appendList = valueList.filter(function (value) {
        if (curValue.indexOf(value + ";") === -1) {
          return true;
        }
        return false;
      });

      if (appendList.length) {
        const appendStr = addChar + appendList.join(";");
        if (ACT_SESSION_TYPE === "CommandPrompt") {
          const head = curValue ? `%${key}%` : "";
          cmdList.push(`set ${key}=${head}${appendStr}`);
        } else if (ACT_SESSION_TYPE === "PowerShell") {
          cmdList.push(`$Env:${key}${curValue && "+"}="${appendStr}"`);
        }
      }
    }

    await this.socket.SetProcessCommand(cmdList.join("\n"));
  }
}
