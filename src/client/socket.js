import net from "net";

import { SOCKET_HOST, SOCKET_PORT } from "./constant.js";
import { Shell } from "../public/Shell.js";

class SocketBase {
  constructor() {
    this.client = net.connect({
      host: SOCKET_HOST,
      port: SOCKET_PORT,
    });
    this.resolve = null;
    this.client.on("error", (err) => {});
    this.client.on("close", (hasErr) => {
      this.closed = true;
      const reject = this.reject;
      if (reject) {
        this.reject = null;
        this.resolve = null;
        reject("connection close");
      }
    });
    this.client.on("data", (res) => {
      const resText = res.toString();
      const resInfo = JSON.parse(resText);
      if (this.resolve) {
        this.resolve(resInfo);
      }
    });

    this.shell = new Shell();
  }

  send(data) {
    return new Promise((resolve, reject) => {
      if (this.closed) {
        reject("connection close");
        return;
      }
      const sendText = JSON.stringify(data);
      this.client.write(sendText, "utf-8");
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  end() {
    return new Promise((resolve, reject) => {
      this.client.end(function () {
        resolve();
      });
    });
  }
}

class SocketClient extends SocketBase {
  constructor() {
    super();
  }

  async GetVolumeBySerialNumber(serialNumber) {
    const result = await this.send({
      type: "GetVolumeBySerialNumber",
      args: [serialNumber + ""],
    });
    return result;
  }

  async GetVhdFileHasAttach(filepath) {
    const result = await this.send({
      type: "GetVhdFileHasAttach",
      args: [filepath],
    });
    return result;
  }

  async SetVhdFileMount(filepath) {
    const result = await this.send({
      type: "SetVhdFileMount",
      args: [filepath],
    });
    return result;
  }

  async SetVhdFileDisMount(filepath) {
    await this.send({
      type: "SetVhdFileDisMount",
      args: [filepath],
    });
  }

  async SetProcessCommand(cmdStr) {
    const pid = await this.shell.GetSessionPid();
    await this.send({
      type: "SetProcessCommand",
      args: [pid, cmdStr],
    });
  }

  async GetProcessCommand() {
    const pid = await this.shell.GetSessionPid();
    return await this.send({ type: "GetProcessCommand", args: [pid] });
  }
}

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = new SocketClient();
  }
  return socket;
}
