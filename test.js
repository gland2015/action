import child_process from "child_process";

child_process.exec(
  `powershell.exe -Command "(Get-DiskImage -ImagePath F:\\project\\my_npm_package.vhdx | Select-Object 'Attached' -First 1)[0]"`,
  function (error, stdout, stderr) {
    console.log("error", error);
    console.log("stdout", stdout, stdout.length, stdout.trim().length);
    console.log("stderr", JSON.stringify(stderr));
  }
);


child_process.exec
