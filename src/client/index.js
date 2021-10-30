import { Command } from "commander";
import { prompt } from "./utils.js";

import { Code } from "./cmd_code.js";
import { Vhd } from "./cmd_vhd.js";
import { Unvhd } from "./cmd_unvhd.js";
import { Env } from "./cmd_env.js";
import { Init } from "./cmd_init.js";
import { Http } from "./cmd_http.js";
import { Proxy } from "./cmd_proxy.js";
import { Test } from "./cmd_test.js";
import { Download } from "./cmd_download.js";

const program = new Command();

program.version("1.0.0");

program
  .command("code")
  .argument("[target]", "to open target")
  .action(async function (target) {
    await new Code().exec(target);
    process.exit();
  });

program
  .command("vhd")
  .argument("[target]", "to load target")
  .action(async function (target) {
    await new Vhd().exec(target);
    process.exit();
  });

program
  .command("unvhd")
  .argument("[target]", "to load target")
  .action(async function (target) {
    await new Unvhd().exec(target);
    process.exit();
  });

program
  .command("env") // hashcat, frp, caddy, http_proxy
  .argument("[target]", "to set target env")
  .action(async function (target) {
    await new Env().exec(target);
    process.exit();
  });

program.command("init").action(async function (target) {
  await new Init().exec();
  process.exit();
});

program
  .command("http")
  .option("--dir <dir>", "Server Root Directory")
  .option("--port <port>", "Server Listening Port")
  .option("--proxy <proxy>", "Proxy Target")
  .option("--https", "Enable HTTPS")
  .action(async function (target) {
    await new Http().exec(target);
    process.exit();
  });

program
  .command("proxy")
  .option("--map <map>", "URI -> FILE Map, JSON FILE")
  .action(async function (args) {
    await new Proxy().exec(args);
    process.exit();
  });

program
  .command("download")
  .arguments("[URL] [outFile]", "URL and outFile")
  .action(async function (URL, outFile) {
    await new Download().exec({ URL, outFile });
    process.exit();
  });

program.command("test").action(async function (args) {
  await new Test().exec(args);
  process.exit();
});

program
  .command("port")
  .argument("[target]", "to port target")
  .action(function (target) {
    console.log("port target - " + target);
  });

program
  .command("git")
  .argument("[target]", "to git target")
  .action(function (target) {
    console.log("git target - " + target);
  });

// console.log("process.argv", process.argv);
program.parse(process.argv);

// 查看端口占用
// Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess
// netstat -aon | findstr "9050"
// Get-NetTCPConnection -State Listen
// https://adamtheautomator.com/netstat-port/

/*
bat cmd执行字符串命令：
新的进程里:
  https://docs.microsoft.com/en-us/previous-versions/windows/it-pro/windows-xp/bb490880(v=technet.10)?redirectedfrom=MSDN#EBAA
  cmd.exe /c "echo 88"
  cmd.exe /k "echo 88"
  cmd.exe /c "set GG='797' | echo %GG%" // 不能有空格
当前进程：
  set cmdstr=set GG=888
  %cmdstr%
  echo %GG%
获取PID:
  powershell (Get-WmiObject Win32_Process -Filter ProcessId=$PID).ParentProcessId

powershell:
在当前进程执行:
  $Command = "Get-Process"
  Invoke-Expression $Command
获取当前PID: $PID

*/

/*
todo 禁止自动分配, vhd分配指定盘符 diskpart disable auto physical
*/

// 获取磁盘序列号
// wmic diskdrive get Name, Manufacturer, Model, InterfaceType, MediaType, SerialNumber
// 或 Get-PhysicalDisk | Select-Object FriendlyName,SerialNumber
// serial number 184379401433

// 通过序列号获取磁盘
//  (Get-PhysicalDisk -SerialNumber 184379401433 | Get-Disk | Get-Partition | Get-Volume).

// Get-PhysicalDisk -SerialNumber 184379401433 | Get-Disk | Get-Partition | Get-Volume | ConvertTo-Json -Depth 10
// Get-Partition -DiskNumber (Get-Disk | Where-Object {$_.SerialNumber -Match "184379401433"})[0].Number | Get-Volume | ConvertTo-Json -Depth 10

// 获取是否挂载
// Get-DiskImage -ImagePath F:\project\c_plus.vhdx
// Get-DiskImage -ImagePath F:\project\my_npm_package.vhdx | Select-Object 'Attached' -First 1 | Format-Table -HideTableHeaders
// Get-DiskImage -ImagePath F:\project\my_npm_package.vhdx | % { $_.Attached[0] }

// 获取盘符 (需要管理员权限)
// Get-DiskImage -ImagePath F:\project\my_npm_package.vhdx | Get-Disk | Get-Partition | Get-Volume | ConvertTo-Json

// Get-DiskImage -ImagePath F:\project\my_npm_package.vhdx | Get-Volume -DiskImage $_

// 挂载vhd
// Mount-DiskImage -ImagePath "F:\project\my_npm_package.vhdx"

// 分离vhd
// Dismount-DiskImage -ImagePath "F:\project\my_npm_package.vhdx"

// 获取.net fram 版本: Get-ChildItem 'HKLM:\SOFTWARE\Microsoft\NET Framework Setup\NDP' -Recurse | Get-ItemProperty -Name version -EA 0 | Where { $_.PSChildName -Match '^(?!S)\p{L}'} | Select PSChildName, version

// System.ArgumentException: The path is empty
// PublishSingleFile -> false
// Could not load file or assembly 'Microsoft.Management.Infrastructure:
//    发布使用： dotnet publish -o .\publish -r win10-x64

// sc create "gland-service" binPath="C:\programfiles\.meta\action\src\service\publish\service.exe --contentRoot C:\programfiles\.meta\action\src\service\publish"

// sc create "gland-service" binPath= "C:\programfiles\__meta\action\test\win_services.exe"
// dotnet publish -o .\publish -r win10-x64

// sc create "gland-service" binPath= "\"C:\programfiles\__meta\action\test\win_services.exe\" \"myargs1\" \"myargs2\"" start= auto type= interact type= own displayname= "gland-service"

// sc create "gland-service" binPath= "\"C:\programfiles\__meta\action\test\win_services.exe\" --command \"node C:\programfiles\__meta\action\src\client\server.js\" --cwd \"C:\programfiles\__meta\action\src\client\""

// sc create gland-service binPath= "C:\programfiles\__meta\action\test\win_services.exe --cmd node C:\programfiles\__meta\action\src\client\server.js --cwd C:\programfiles\__meta\action\src\client" start= auto displayname= gland-service
// powershell 引号内 两个引号转义 "", 或使用撇号 `

// bat文件中 %~dp0 表示当前bat所在的文件夹，结尾带反斜杠

//  for /f %%a in ('node ./test.js') do set "dow=%%a"

/*

@echo off
SET TOTO_1_2=hello
set "varName=TOTO_1_2"
echo 0: %TOTO_1_2% 
call echo 1: %%%varName%%%

setlocal enabledelayedexpansion
for %%i in (%varname%) do echo 2: !%%i!
echo 3: !%varName%!

*/

/*
  bat中变量延迟扩展： setlocal enabledelayedexpansion
  使用!var!扩展变量，可以两次扩展

  另外两次扩展可以： call .... ，一个新的解释器
  或者一个临时的批处理文件

*/
// %USERPROFILE%\AppData\Local\Microsoft\WindowsApps;C:\Program Files\Bandizip\;C:\Users\gland\AppData\Local\Programs\Microsoft VS Code\bin;C:\programfiles;%USERPROFILE%\.dotnet\tools;C:\Users\gland\AppData\Roaming\npm;

// 打开vscode内置 simple browser: ctrl + shift + p -> 输入simple browser
