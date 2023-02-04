import dns from "dns";
import os from "os";
import * as fs from "fs";
import { join } from "path";

export function objectToString(obj: any): string {
  if (!obj) return "";

  if (typeof obj === "object") {
    return JSON.stringify(obj, null, 2);
  } else if (obj.toString) {
    return obj.toString();
  } else {
    return obj;
  }
}

export async function MyIpInfo(): Promise<string> {
  return new Promise((resolve) => {
    dns.lookup(os.hostname(), (err, add, fam) => {
      resolve(add);
    });
  });
}

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function ensureExists(path: string) {
  try {
    fs.mkdirSync(path, { recursive: true });
  } catch (e) {}
}

export function findAllFileInDir(
  basePath: string,
  path: string,
  fileName: string | RegExp
): string[] {
  const files = fs.readdirSync(join(basePath, path));
  let res: string[] = [];
  const regx = new RegExp(fileName, "g");
  for (const f of files) {
    const thisPath = join(basePath, path, f);
    const thisPathRelative = join(path, f);
    if (fs.statSync(join(thisPath)).isDirectory()) {
      res = res.concat(findAllFileInDir(basePath, thisPathRelative, fileName));
    } else if (regx.test(f)) {
      res.push(thisPathRelative);
    }
  }
  return res;
}
