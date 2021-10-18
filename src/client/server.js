import net from "net";
import fs from "fs";

const text = fs.readFileSync("./2").toString();

const server = net.createServer((c) => {
  // 'connection' listener.
  console.log("client connected");
  c.on("end", () => {
    console.log("client disconnected");
  });
  c.write(text + "\r\n"); //
  
  c.pipe(c);
});
server.on("error", (err) => {
  throw err;
});
server.listen(8124, () => {
  console.log("server bound");
});
