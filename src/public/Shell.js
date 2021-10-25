import { PowerShell } from "node-powershell";
import { makeStepExec } from "./makeStepExec.js";

export class Shell {
  constructor(preload) {
    this.$runCmd = null;
    if (preload) {
      this.runCmd(`
        Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
        Import-Module -Name Storage -Global
        Import-Module -Name CimCmdlets -Global
        Import-Module -Name Microsoft.PowerShell.Utility -Global
        Import-Module -Name Microsoft.PowerShell.Management -Global
        Get-Disk | Get-Partition | Get-Volume | ConvertTo-Json -Depth 2
      `);
    }
  }

  get runCmd() {
    if (!this.$runCmd) {
      const ps = new PowerShell();
      this.$runCmd = makeStepExec(async (cmd) => {
        cmd = cmd + "";
        const list = cmd
          .split("\n")
          .map((o) => o.trim())
          .filter(Boolean);
        let r = null;
        for (let i = 0; i < list.length; i++) {
          let cmd = list[i];
          await ps.addCommand(cmd);
          r = await ps.invoke();
        }
        return r && r.result;
      });
    }
    return this.$runCmd;
  }

  selectMaxVolume(data, fn) {
    let size = 0;
    let tarVol;
    if (Array.isArray(data)) {
      data.forEach(function (item) {
        if (item.Size > size) {
          size = item.Size;
          tarVol = item;
        }
      });
    } else {
      tarVol = data;
    }
    return fn(tarVol);
  }

  async GetVolumeBySerialNumber(serialNumber) {
    const diskStr = await this.runCmd(`
      Get-Partition -DiskNumber (Get-Disk | Where-Object {$_.SerialNumber -Match ${serialNumber.trim()}})[0].Number | Get-Volume | ConvertTo-Json -Depth 2
    `);
    const diskInfo = JSON.parse(diskStr);
    return this.selectMaxVolume(diskInfo, (o) => o.DriveLetter);
  }

  async GetVhdFileHasAttach(filepath) {
    const diskStr = await this.runCmd(`
      Get-DiskImage -ImagePath ${filepath.trim()} | ConvertTo-Json -Depth 2
    `);
    const diskInfo = JSON.parse(diskStr);
    return this.selectMaxVolume(diskInfo, (o) => o.Attached);
  }

  async SetVhdFileMount(filepath) {
    filepath = filepath.trim();
    const hasAttached = await this.GetVhdFileHasAttach(filepath);
    if (!hasAttached) {
      await this.runCmd(`
        Mount-DiskImage -ImagePath ${filepath}
      `);
    }
    const volStr = await this.runCmd(`
      Get-DiskImage -ImagePath ${filepath} | Get-Disk | Get-Partition | Get-Volume | ConvertTo-Json -Depth 2
    `);
    const volInfo = JSON.parse(volStr);
    return this.selectMaxVolume(volInfo, (o) => o.DriveLetter);
  }

  async SetVhdFileDisMount(filepath) {
    filepath = filepath.trim();
    const hasAttached = await this.GetVhdFileHasAttach(filepath);
    if (hasAttached) {
      await this.runCmd(`
        Dismount-DiskImage -ImagePath ${filepath}
      `);
    }
  }

  async GetSessionPid() {
    const result = await this.runCmd(`
        $tempId = (Get-WmiObject Win32_Process -Filter ProcessId=$PID).ParentProcessId
        (Get-WmiObject Win32_Process -Filter ProcessId=$tempId).ParentProcessId
    `);
    return result;
  }
}