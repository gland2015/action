import net from "net";

let s = net.connect({ host: "127.0.0.1", port: 18080 });

s.on("data", (d) => {
  let str = d.toString();

  console.log("s", str);
});

s.write("1");
