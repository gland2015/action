import { Shell } from "../public/Shell.js";

export class Port {
  constructor() {
    this.shell = new Shell();
  }

  async exec({ actionType, portNum }) {
    if (actionType === "status") {
      let result = await this.shell.GetProcessStatusByPort(portNum);
      console.log(result);
      return;
    }
    if (actionType === "kill") {
      await this.shell.SetProcessKillByPort(portNum);
    }
  }
}
