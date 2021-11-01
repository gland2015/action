import fs from "fs-extra";
import inquirer from "inquirer";

export const prompt = inquirer.createPromptModule();

export async function isFileExist(filepath) {
  let isExist = await fs.pathExists(filepath);
  if (!isExist) return false;
  let stat = await fs.stat(filepath);
  if (!stat.isFile()) {
    return false;
  }
  return true;
}
