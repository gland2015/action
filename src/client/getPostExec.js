import { getSocket } from "./socket.js";

const socket = getSocket();
socket
  .GetProcessCommand()
  .then((r) => {
    console.log(r);
    process.exit();
  })
  .catch((err) => {
    process.exit();
  });
