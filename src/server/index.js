import net from "net";
import { ProcessHelper } from "./ProcessHelper.js";
import { Shell } from "../public/Shell.js";

async function run() {
  const processHelper = new ProcessHelper();
  const shell = new Shell(true);

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

      console.log("exec time: ", Date.now() - t);

      connection.write(JSON.stringify(payload));
      connection.pipe(connection);
    });
  });

  server.listen(8098, function () {
    console.log("server is listening");
  });

  server.on("error", function () {});
}

run();
