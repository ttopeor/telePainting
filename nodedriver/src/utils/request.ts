import { LogManager_Instance } from "../managers";
import fetch from "node-fetch";
export async function request(url: string, method = "GET", payload: any = {}) {
  if (method === "GET") {
    return fetch(url)
      .then((j) => j.json())
      .catch((e) =>
        LogManager_Instance.logger.error(`Failed to fetch ${url}: ${e.message}`)
      );
  } else {
    return fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    })
      .then((j) => j.json())
      .catch((e) =>
        LogManager_Instance.logger.error(`Failed to fetch ${url}: ${e.message}`)
      );
  }
}
