import path from "path";
import fs from "fs-extra";

import { getSocket } from "./socket.js";
import { ActionType } from "./constant.js";
import { DiskHelper } from "./diskHelper.js";

export class DiskBase {
  constructor() {
    this.diskHelper = new DiskHelper();
  }

  get socket() {
    return getSocket();
  }

  async loadPhysicalDisk(serialNumber) {
    let letter = await this.socket.GetVolumeBySerialNumber(serialNumber);
    if (letter) {
      return letter;
    }

    return new Promise(function (resolve, reject) {
      child_process.exec(
        "wmic diskdrive get Model, InterfaceType, MediaType, SerialNumber",
        function (error, stdout, stderr) {
          reject({
            action: ActionType.SHOW_MESSAGE,
            message: [
              `Physical disk that sericalNumber is ${serialNumber} not found!`,
              `The following is a list of available disks:`,
              stdout,
            ].join("\n"),
          });
        }
      );
    });
  }

  async loadVhdDisk(letter, rePath) {
    const filepath = rePath ? path.resolve(letter + ":/", rePath) : letter;
    const exist = await fs.pathExists(filepath);
    if (!exist) {
      throw {
        type: ActionType.SHOW_MESSAGE,
        message: `vhd file "${filepath}" is not find, please check config file.`,
      };
    }

    const hasAttached = await this.socket.GetVhdFileDiskStatus(filepath);
    if (!hasAttached) {
      await this.socket.SetVhdFileMount(filepath);
    }
    return await this.socket.GetVolumeByVhdFile(filepath);
  }

  async unloadVhdDisk(letter, rePath) {
    const filepath = rePath ? path.resolve(letter + ":/", rePath) : letter;
    const exist = await fs.pathExists(filepath);
    if (!exist) {
      throw {
        type: ActionType.SHOW_MESSAGE,
        message: `vhd file "${filepath}" is not find, please check config file.`,
      };
    }

    const hasAttached = await this.socket.GetVhdFileDiskStatus(filepath);
    if (hasAttached) {
      await this.socket.SetVhdFileDisMount(filepath);
    }
  }

  async getDiskLetterByList(list) {
    let diskLetter;
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (item.type === this.diskHelper.itemType.physicalDisk) {
        diskLetter = await this.loadPhysicalDisk(item.serialNumber);
        continue;
      }
      if (item.type === this.diskHelper.itemType.virtualDisk) {
        diskLetter = await this.loadVhdDisk(diskLetter, item.filepath);
        continue;
      }
    }

    return diskLetter;
  }
}
