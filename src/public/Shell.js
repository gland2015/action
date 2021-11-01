import path from "path";
import fs from "fs-extra";
import child_process from "child_process";
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

  /*--------  Storage Operation --------*/
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

  /*-------- Process Operation ----------*/
  async GetSessionPid() {
    const result = await this.runCmd(`
        $tempId = (Get-WmiObject Win32_Process -Filter ProcessId=$PID).ParentProcessId
        (Get-WmiObject Win32_Process -Filter ProcessId=$tempId).ParentProcessId
    `);
    return result;
  }

  async GetSessionPid2() {
    const result = await this.runCmd(`
        $tempId = (Get-WmiObject Win32_Process -Filter ProcessId=$PID).ParentProcessId
        $tempId = (Get-WmiObject Win32_Process -Filter ProcessId=$tempId).ParentProcessId
        (Get-WmiObject Win32_Process -Filter ProcessId=$tempId).ParentProcessId
    `);
    return result;
  }

  async GetProcessIdByPort(port) {
    let result = "";
    try {
      result = await this.runCmd(`
        (Get-NetTCPConnection -LocalPort ${port} | Where-Object {$_.State -Match "Listen"}).OwningProcess[0]
      `);
    } catch {}
    return result.trim();
  }

  async GetProcessStatusByPort(port) {
    let pid = await this.GetProcessIdByPort(port);
    if (pid) {
      let result = await this.runCmd(`
        Get-Process -Id ${pid}
      `);
      return result;
    }
  }

  async SetProcessKillByPort(port) {
    let pid = await this.GetProcessIdByPort(port);
    if (pid) {
      await this.runCmd(`
        Stop-Process -ID ${pid} -Force
      `);
    }
  }

  /*----------- Env Operation ------------*/
  async GetUserEnvList() {
    const listStr = await this.runCmd(`
      reg query HKCU\\Environment
    `);
    const envList = listStr
      .split("\n")
      .map((o) => o.trim())
      .filter(Boolean)
      .filter((o, i) => i)
      .map((o) => {
        const mat = o.match(/(\w+)\s+(\w+)\s+(.*)/);
        return {
          name: mat[1],
          type: mat[2],
          value: mat[3] || "",
        };
      });
    return envList;
  }

  async GetUserEnvByKey(key) {
    const envList = await this.GetUserEnvList();
    return envList.find((o) => o.name.toLowerCase() === key.toLowerCase());
  }

  async SetUserEnvValue(key, value) {
    await this.runCmd(`
      Set-ItemProperty -Path HKCU:\\Environment -Name ${key} -Value "${value}" -Type ExpandString
    `);
  }

  /*--------------- SSL CERT Operation ----------------*/
  async GenSSLRootCA(outdir) {
    outdir = outdir || "./";
    let dirExist = await fs.pathExists(outdir);
    if (!dirExist) {
      throw new Error("path is not exist: " + outdir);
    }

    let basename = "RootCA";
    if (!basename) {
      basename = "RootCA";
    }
    basename += "";

    const outkeypath = path.join(outdir, basename + ".key");
    const outpempath = path.join(outdir, basename + ".pem");
    const outcrtpath = path.join(outdir, basename + ".crt");

    try {
      await this.runCmd(`
        openssl req -x509 -nodes -new -sha256 -days 102400 -newkey rsa:2048 -keyout "${outkeypath}" -out "${outpempath}" -subj "/C=US/CN=Example-Root-CA"
      `);
    } catch {}

    await this.runCmd(`
      openssl x509 -outform pem -in "${outpempath}" -out "${outcrtpath}"
    `);
  }

  async GenSSLSubCert(
    domainList,
    ipList,
    outDir,
    basename,
    ca_pem_path,
    ca_key_path
  ) {
    const domainsExtArr = [
      "authorityKeyIdentifier=keyid,issuer",
      "basicConstraints=CA:FALSE",
      "keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment",
      "subjectAltName = @alt_names",
      "[alt_names]",
    ];
    if (domainList) {
      domainList.forEach((o, i) => {
        domainsExtArr.push(`DNS.${i + 1} = ${o}`);
      });
    }
    if (ipList) {
      ipList.forEach((o, i) => {
        domainsExtArr.push(`IP.${i + 1} = ${o}`);
      });
    }

    const domainsExtText = domainsExtArr.join("\n");

    const outDomainExtPath = path.join(outDir, "domains.ext");
    await fs.outputFile(outDomainExtPath, domainsExtText);

    const outkeypath = path.join(outDir, basename + ".key");
    const outcsrpath = path.join(outDir, basename + ".csr");
    const outcrtpath = path.join(outDir, basename + ".crt");

    try {
      await this.runCmd(`
        openssl req -new -nodes -newkey rsa:2048 -keyout "${outkeypath}" -out "${outcsrpath}" -subj "/C=US/ST=YourState/L=YourCity/O=Example-Certificates/CN=${basename}.local"
    `);
    } catch {}

    await this.runCmd(`
      openssl x509 -req -sha256 -days 102400 -in "${outcsrpath}" -CA "${ca_pem_path}" -CAkey "${ca_key_path}" -CAcreateserial -extfile "${outDomainExtPath}" -out "${outcrtpath}"
    `);
  }

  /* ------------ 网络请求相关 ------------ */
  async download(URL, outFile) {
    if (!URL) {
      throw new Error("please input url");
    }

    if (!outFile) {
      outFile = "./outFile";
    }

    let isExist = await fs.ensureFile(outFile);
    if (isExist) {
      throw new Error("file is exist: " + outFile);
    }

    await this.runCmd(`
      Invoke-WebRequest "${URL}" -OutFile "${outFile}"
    `);
  }
}
