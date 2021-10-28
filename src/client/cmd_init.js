import { InitContent } from "./constant.js";
import { Shell } from "../public/Shell.js";

export class Init {
  constructor() {
    this.shell = new Shell();
  }

  async exec() {
    const { toSet, toAdd } = InitContent.env;
    for (let key in toSet) {
      const value = toSet[key];
      const oldItem = await this.shell.GetUserEnvByKey(key);
      if (oldItem?.value !== value) {
        await this.shell.SetUserEnvValue(key, value);
      }
    }

    for (let key in toAdd) {
      let listValue = toAdd[key];
      if (listValue && listValue.length) {
        let oldItem = await this.shell.GetUserEnvByKey(key);
        if (oldItem) {
          let oldValList = oldItem.value
            .split(";")
            .map((o) => o.trim())
            .filter(Boolean);
          let appendList = listValue.filter(
            (o) => oldValList.indexOf(o) === -1
          );
          if (appendList.length) {
            let setList = oldValList.concat(appendList);
            await this.shell.SetUserEnvValue(key, setList.join(";"));
          }
        } else {
          await this.shell.SetUserEnvValue(key, listValue.join(";"));
        }
      }
    }
  }
}
