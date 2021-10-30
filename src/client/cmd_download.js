import { Shell } from "../public/Shell.js";

export class Download {
  constructor() {
    this.shell = new Shell();
  }

  // https://cdn.stubdownloader.services.mozilla.com/builds/firefox-stub/en-US/win/b2b7944c6fed1b91a97ca9198cddf6ffb43396b4c28c88348a3b3e23dee2f163/Firefox%20Installer.exe
  async exec(args) {
    const a =
      "https://cdn.stubdownloader.services.mozilla.com/builds/firefox-stub/en-US/win/b2b7944c6fed1b91a97ca9198cddf6ffb43396b4c28c88348a3b3e23dee2f163/Firefox%20Installer.exe";
    await this.shell.download(args.URL || a, args.outFile);
  }
}
