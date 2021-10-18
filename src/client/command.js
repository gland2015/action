import path from "path";
import fs from "fs-extra";
import child_process from "child_process";
import { SocketClient } from "./socket";

class CommandHandle {
  constructor(diskContent) {
    this.$client = null;
    this.diskHelper = new DiskHelper();
  }

  async loadvhd(name) {
    let { vhdfile, parents } = this.diskHelper.findVhdFileByName(name);
    if (!vhdfile) {
      throw {
        type: 3,
        message: `not find vhd name: ${name}`,
        list: this.diskHelper.getVhdFileNames(),
      };
    }

    let phyLetter;
    for (let i = 0; i < parents.length; i++) {
      let item = parents[i];
      if (item.type === this.diskHelper.itemType.physicalDisk) {
        phyLetter = await this.loadPhysicalDisk(item.serialNumber);
      }
    }

    await this.loadVhdDisk(phyLetter, vhdfile.filepath);
  }
}
