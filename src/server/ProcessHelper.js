export class ProcessHelper {
  constructor() {
    this.cmdData = {};
  }

  SetProcessCommand(key, value) {
    console.log("key", key);
    this.cmdData[key] = {
      time: Date.now(),
      value: value.trim(),
    };
  }

  GetProcessCommand(key) {
    const data = this.cmdData[key];
    console.log("key", key, data);

    if (data) {
      delete this.cmdData[key];
      if (Date.now() - data.time < 1000 * 60) {
        return data.value || "";
      }
    }
    return "";
  }
}
