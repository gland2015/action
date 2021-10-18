import net from "net";
import EventEmitter from "events";

import { SOCKET_HOST, SOCKET_PORT } from "./constant.js";

class SocketBase {
  constructor() {
    this.client = net.connect({
      host: SOCKET_HOST,
      port: SOCKET_PORT,
    });
    this.msgId = 1;
    this.cacheData = "";
    this.event = new EventEmitter();

    this.client.on("error", (err) => {
      this.end(err);
    });
    this.client.on("close", (hasErr) => {
      this.end();
    });

    this.client.on("data", (res) => {
      let text;
      let resText = res.toString();
      if (resText.match(/\~\$end$/)) {
        text = this.cacheData + resText.slice(0, -5);
        this.cacheData = "";
      } else {
        this.cacheData += resText;
        return;
      }

      let json;
      try {
        let deStr = Buffer.from(text, "base64").toString();
        json = JSON.parse(deStr);
      } catch (err) {
        console.log("err", err);
      }

      if (json && json.msgId) {
        let payload;
        try {
          payload = JSON.parse(json.payload);
        } catch {
          payload = undefined;
        }

        // fs.writeFileSync("./1", JSON.stringify(payload));
        if (payload !== undefined) {
          this.event.emit("data", payload, json.msgId, null);
        }
      }
    });
  }

  getMsgId() {
    let id = this.msgId;
    this.msgId++;
    return id;
  }

  send(data) {
    return new Promise((resolve, reject) => {
      let msgId = this.getMsgId();
      let text = JSON.stringify({ msgId, payload: data });
      this.client.write(Buffer.from(text).toString("base64"), "utf-8");

      let listener = (rData, id, error) => {
        if (error) {
          this.event.removeListener("data", listener);
          reject(error);
        } else if (id === msgId) {
          this.event.removeListener("data", listener);
          resolve(rData);
        }
      };
      this.event.on("data", listener);
    });
  }

  end(err) {
    this.client.end();
    this.event.emit("data", null, null, err || "socket close");
  }
}

class SocketClient extends SocketBase {
  constructor() {
    super();
  }

  selectMaxVolume(r, fn) {
    let size = 0;
    let o;

    if (Array.isArray(r)) {
      r.forEach(function (item) {
        if (item.Size > size) {
          size = item.Size;
          o = item;
        }
      });
    } else {
      o = r;
    }

    return fn(o);
  }

  async GetVolumeByVhdFile(filepath) {
    let r = await this.send({
      type: "GetVolumeByVhdFile",
      args: [filepath], // "F:\\project\\my_npm_package.vhdx"
    });

    if (!r) return "";
    return this.selectMaxVolume(r, (o) => o.DriveLetter);
  }

  async GetVolumeBySerialNumber(serialNumber) {
    let r = await this.send({
      type: "GetVolumeBySerialNumber",
      args: [serialNumber + ""],
    });

    if (!r) return "";
    return this.selectMaxVolume(r, (o) => o.DriveLetter);
  }

  async SetVhdFileMount(filepath) {
    await this.send({
      type: "SetVhdFileMount",
      args: [filepath],
    });
  }

  async SetVhdFileDisMount(filepath) {
    await this.send({
      type: "SetVhdFileDisMount",
      args: [filepath],
    });
  }

  async GetVhdFileDiskStatus(filepath) {
    let r = await this.send({
      type: "GetVhdFileDiskStatus",
      args: [filepath],
    });

    if (!r) return false;
    return this.selectMaxVolume(r, (o) => o.Attached);
  }
}

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = new SocketClient();
  }
  return socket;
}
