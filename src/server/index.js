import net from "net";
import child_process from "child_process";

const server = net.createServer(function (connection) {
  connection.on("error", function (error) {});
  connection.on("data", function (buff) {
    let text = buff.toString();
    let json = JSON.parse(text);

    console.log("json", json);

    child_process.exec(
      `powershell.exe -Command "Get-DiskImage -ImagePath F:\\project\\my_npm_package.vhdx | Get-Disk | Get-Partition | Get-Volume"`,
      function (error, stdout, stderr) {
        console.log("errrrr", error, stdout, stderr);
      }
    );

    connection.write(JSON.stringify({ isRes: true, payload: { a: 3 } }));
    connection.pipe(connection);
  });
});

server.listen(18080, function () {
  console.log("server is listening");
});


// 保存磁盘id，如果磁盘列表中有这个磁盘id，则快速映射，否则挂载后更新
