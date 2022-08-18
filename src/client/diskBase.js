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

  async getPhysicalDiskLetter(serialNumber) {
    let letter = await this.socket.GetVolumeBySerialNumber(serialNumber);
    if (letter) {
      return letter;
    }

    return new Promise(function (resolve, reject) {
      child_process.exec("wmic diskdrive get Model, InterfaceType, MediaType, SerialNumber", function (error, stdout, stderr) {
        reject({
          action: ActionType.SHOW_MESSAGE,
          message: [`Physical disk that sericalNumber is ${serialNumber} not found!`, `The following is a list of available disks:`, stdout].join(
            "\n"
          ),
        });
      });
    });
  }

  async loadVhdDisk(filepath) {
    const exist = await fs.pathExists(filepath);
    if (!exist) {
      throw {
        type: ActionType.SHOW_MESSAGE,
        message: `vhd file "${filepath}" is not find, please check config file.`,
      };
    }
    return this.socket.SetVhdFileMount(filepath);
  }

  async unloadVhdDisk(filepath) {
    const exist = await fs.pathExists(filepath);
    if (!exist) {
      throw {
        type: ActionType.SHOW_MESSAGE,
        message: `vhd file "${filepath}" is not find, please check config file.`,
      };
    }
    await this.socket.SetVhdFileDisMount(filepath);
  }

  async getRootPathBy(list) {
    let tarPath = "";
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (item.type === this.diskHelper.itemType.physicalDisk) {
        const diskDir = item.mountDir && item.mountDir[0];
        if (diskDir) {
          tarPath = diskDir;
        } else {
          const letter = await this.loadPhysicalDisk(item.serialNumber);
          tarPath = letter + ":/";
        }
        continue;
      }

      if (item.type === this.diskHelper.itemType.virtualDisk) {
        let p = path.resolve(tarPath, item.filepath);
        // console.log("p", p);
        tarPath = await this.loadVhdDisk(p);
        continue;
      }
    }
    return tarPath;
  }
}
