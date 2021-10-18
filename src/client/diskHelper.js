import { diskContent } from "./constant.js";

export class DiskHelper {
  constructor() {
    this.diskContent = diskContent;
  }

  itemType = {
    physicalDisk: "physicalDisk",
    virtualDisk: "virtualDisk",
    project: "project",
  };

  findContent(fn) {
    const findFn = (arr, parents) => {
      if (arr && arr.length) {
        arr.forEach((o) => {
          fn(o, parents);
          if (o.childs) {
            findFn(o.childs, parents.concat(o));
          }
        });
      }
    };

    findFn(this.diskContent, []);
  }

  getProjectNames() {
    let list = [];
    this.findContent((o) => {
      if (o.type === this.itemType.project) {
        list.push(o.name);
      }
    });
    return list;
  }

  getVhdFileNames() {
    let list = [];
    this.findContent((o) => {
      if (o.type === this.itemType.virtualDisk) {
        list.push(o.name);
      }
    });
    return list;
  }

  findProjectByName(name) {
    let result = {
      project: null,
      parents: [],
    };

    this.findContent((o, parents) => {
      if (o.type === this.itemType.project && o.name === name) {
        result.parents = parents;
        result.project = o;
      }
    });
    return result;
  }

  findVhdFileByName(name) {
    let result = {
      vhdfile: null,
      parents: [],
    };

    this.findContent((o, parents) => {
      if (o.type === this.itemType.virtualDisk && o.name === name) {
        result.parents = parents;
        result.vhdfile = o;
      }
    });
    return result;
  }
}
