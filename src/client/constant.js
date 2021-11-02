import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  taskList,
  InitContent,
  EnvContent,
  diskContent,
  SOCKET_PORT,
  SOCKET_HOST,
  HTTP_SERVER_PORT,
  HTTP_MITM_PROXY_PORT,
} from "../../../config/main/index.js";

export {
  taskList,
  InitContent,
  EnvContent,
  diskContent,
  SOCKET_PORT,
  SOCKET_HOST,
  HTTP_SERVER_PORT,
  HTTP_MITM_PROXY_PORT,
};

export const CONFIG_ROOT_PATH = path.resolve(__dirname, "../../../config");
export const SSL_CERT_ROOT_PATH = path.resolve(CONFIG_ROOT_PATH, "./ssl_cert");

export const ACT_SESSION_TYPE = (process.env.ACT_SESSION_TYPE || "").trim();
export const ACT_SESSION_ID = (process.env.ACT_SESSION_ID || "").trim();

export const ActionType = {
  SHOW_MESSAGE: "SHOW_MESSAGE",
  RESELECT: "RESELECT",
};
