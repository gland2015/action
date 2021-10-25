export class ProcessHelper {
  constructor() {
    this.cmdData = {};
  }

  SetProcessCommand(key, value) {
    this.cmdData[key] = {
      time: Date.now(),
      value,
    };
  }

  GetProcessCommand(key) {
    const data = this.cmdData[key];
    if (data) {
      delete this.cmdData[key];
      if (Date.now() - data.time < 1000 * 60) {
        return data.value || "";
      }
    }
    return "";
  }
}
