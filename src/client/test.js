import child_process from "child_process";

function run() {
  child_process.exec("wmic diskdrive get Model, InterfaceType, MediaType, SerialNumber", function (error, stdout, stderr) {
    console.log(typeof stdout);
  });
}

run();
