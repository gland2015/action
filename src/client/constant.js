export const SOCKET_PORT = 8098;
export const SOCKET_HOST = "127.0.0.1";

export const ActionType = {
  SHOW_MESSAGE: "SHOW_MESSAGE",
  RESELECT: "RESELECT",
};

export const diskContent = [
  {
    type: "physicalDisk",
    serialNumber: "184379401433",
    childs: [
      {
        type: "virtualDisk",
        name: "my_npm_package",
        filepath: "project/my_npm_package.vhdx",
        childs: [
          {
            type: "project",
            name: "knowledge_base",
            filepath: "knowledge_base",
          },
          {
            type: "project",
            name: "gland",
            filepath: "gland",
          },
          {
            type: "project",
            name: "jsable",
            filepath: "jsable",
          },
          {
            type: "project",
            name: "gland2015.github.io",
            filepath: "gland2015.github.io",
          },
        ],
      },
      {
        type: "virtualDisk",
        name: "yilinku",
        filepath: "project/yilinku.vhdx",
        childs: [
          {
            type: "project",
            name: "yilinku_back",
            filepath: "yilinku_back",
          },
          {
            type: "project",
            name: "yilinku_front",
            filepath: "yilinku_front",
          },
          {
            type: "project",
            name: "yilinku_site",
            filepath: "yilinku_site",
          },
        ],
      },
      {
        type: "virtualDisk",
        name: "c_plus",
        filepath: "project/c_plus.vhdx",
      },
      {
        type: "virtualDisk",
        name: "flutter",
        filepath: "project/flutter.vhdx",
      },
      {
        type: "virtualDisk",
        name: "electron",
        filepath: "project/electron.vhdx",
      },
      {
        type: "virtualDisk",
        name: "hotel_minprogram",
        filepath: "project/hotel_minprogram.vhdx",
      },
    ],
  },
];
