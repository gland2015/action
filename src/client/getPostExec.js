import { getSocket } from "./socket.js";

const socket = getSocket();
socket
  .GetProcessCommand()
  .then((r) => {
    if (r) {
      console.log(r.trim());
    }
    process.exit();
  })
  .catch((err) => {
    process.exit();
  });
  