export const ACT_SESSION_TYPE = (process.env.ACT_SESSION_TYPE || "").trim();
export const ACT_SESSION_ID = (process.env.ACT_SESSION_ID || "").trim();
export const SOCKET_PORT = 8098;
export const SOCKET_HOST = "127.0.0.1";

export const ActionType = {
  SHOW_MESSAGE: "SHOW_MESSAGE",
  RESELECT: "RESELECT",
};

export const EnvContent = [
  {
    name: "proxy_local",
    setValue: {
      HTTP_PROXY: "http://127.0.0.1:10081",
      HTTPS_PROXY: "http://127.0.0.1:10081",
    },
    addValue: {},
  },
  {
    name: "proxy_public",
    setValue: {
      HTTP_PROXY: "http://106.15.236.181:10081",
      HTTPS_PROXY: "http://106.15.236.181:10081",
    },
    addValue: {},
  },
  {
    name: "frp",
    setValue: {},
    addValue: {
      path: ["C:\\programfiles\\frp"],
    },
  },
  {
    name: "caddy",
    setValue: {},
    addValue: {
      path: ["C:\\programfiles\\caddy"],
    },
  },
  {
    name: "hashcat",
    setValue: {},
    addValue: {
      path: ["C:\\programfiles\\hashcat"],
    },
  },
  {
    name: "ps-tools",
    setValue: {},
    addValue: {
      path: ["C:\\programfiles\\PSTools"],
    },
  },
];

export const diskContent = [
  {
    type: "physicalDisk",
    name: "SanDisk",
    serialNumber: "184379401433",
    mountDir: ["C:/volume/sandisk_main"],
    enable: true,
    childs: [
      {
        type: "virtualDisk",
        name: "my_npm_package",
        filepath: "project/my_npm_package.vhdx",
        enable: true,
        childs: [
          {
            type: "project",
            enable: true,
            name: "knowledge_base",
            filepath: "knowledge_base",
          },
          {
            type: "project",
            enable: true,
            name: "gland",
            filepath: "gland",
          },
          {
            type: "project",
            enable: true,
            name: "jsable",
            filepath: "jsable",
          },
          {
            type: "project",
            enable: true,
            name: "gland2015.github.io",
            filepath: "gland2015.github.io",
          },
        ],
      },
      {
        type: "virtualDisk",
        enable: true,
        name: "yilinku",
        filepath: "project/yilinku.vhdx",
        childs: [
          {
            type: "project",
            enable: true,
            name: "yilinku_back",
            filepath: "yilinku_back",
          },
          {
            type: "project",
            enable: true,
            name: "yilinku_front",
            filepath: "yilinku_front",
          },
          {
            type: "project",
            enable: true,
            name: "yilinku_site",
            filepath: "yilinku_site",
          },
        ],
      },
      {
        type: "virtualDisk",
        enable: true,
        name: "c_plus",
        filepath: "project/c_plus.vhdx",
      },
      {
        type: "virtualDisk",
        enable: true,
        name: "flutter",
        filepath: "project/flutter.vhdx",
      },
      {
        type: "virtualDisk",
        enable: true,
        name: "electron",
        filepath: "project/electron.vhdx",
      },
      {
        type: "virtualDisk",
        enable: true,
        name: "hotel_minprogram",
        filepath: "project/hotel_minprogram.vhdx",
      },
    ],
  },
];
