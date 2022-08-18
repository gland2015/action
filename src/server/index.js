import net from "net";
import fs from "fs";
import express from "express";
import os from "os";
import child_process from "child_process";
import { ProcessHelper } from "./ProcessHelper.js";
import { Shell } from "../public/Shell.js";
import { SOCKET_HOST, SOCKET_PORT, taskList, InitContent } from "../client/constant.js";

run();

async function run() {
  const processHelper = new ProcessHelper();
  const shell = new Shell(true);

  // socket
  const server = net.createServer(function (connection) {
    connection.on("error", function (error) {
      connection.end();
    });
    connection.on("data", async function (buff) {
      let t = Date.now();
      const textData = buff.toString();

      console.log("textData", textData);

      const jsonData = JSON.parse(textData);
      const type = jsonData.type;
      const args = jsonData.args;
      let payload = null;
      if (type === "GetVhdFileHasAttach") {
        payload = await shell.GetVhdFileHasAttach(args[0]);
      } else if (type === "SetVhdFileMount") {
        payload = await shell.SetVhdFileMount(args[0]);
      } else if (type === "SetVhdFileDisMount") {
        payload = await shell.SetVhdFileDisMount(args[0]);
      } else if (type === "GetVolumeBySerialNumber") {
        payload = await shell.GetVolumeBySerialNumber(args[0]);
      } else if (type === "SetProcessCommand") {
        payload = processHelper.SetProcessCommand(args[0], args[1]);
      } else if (type === "GetProcessCommand") {
        payload = processHelper.GetProcessCommand(args[0]);
      }
      payload = payload === undefined ? null : payload;

      console.log("exec time: ", Date.now() - t);
      console.log("payload", payload);

      connection.write(JSON.stringify(payload));
      connection.pipe(connection);
    });
  });

  server.listen(SOCKET_PORT, SOCKET_HOST, function () {
    console.log("server is listening " + SOCKET_PORT);
    runTask(taskList);
  });

  server.on("error", function () {});
}

function runTask(taskList) {
  let env = Object.assign({}, process.env);

  let Path = InitContent?.env?.toAdd?.Path || [];
  env.Path = (env.Path || "") + ";" + Path.join(";");

  taskList.forEach(function (item) {
    if (!item.enable) return;
    if (item.type === "command") {
      setTimeout(() => {
        let subProcess = child_process.spawn(item.content, {
          cwd: item.cwd,
          env: env,
          shell: "pwsh",
          stdio: "pipe",
          windowsHide: true,
          
        });

        subProcess.stdout.pipe(process.stdout);
        subProcess.stderr.pipe(process.stderr);
      }, item.delay || 0);
    }
  });
}

/*
  windows服务默认使用系统账户(system), 需要手动添加用户path
  获取当前用户信息: require("os").userInfo()

*/
