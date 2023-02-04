import os from "os";
import manifest from "./manifest.json";

const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

export const Environment = {
  appName: "Mobility-Lab system",
  isProduction: !isDev,
  dataPath: isDev ? "data" : process.env.DATA_PATH || "data",
  hostName: os.hostname(),
  buildVersion: manifest.buildVersion,
  buildCommit: manifest.buildCommit,
  port: isDev ? 8080 : process.env.PORT || 8080,
  mqttRefreshInterval: 16.666,
  mqttAddress: isDev
    ? "mqtt://localhost"
    : process.env.MQTT_ADDRESS || "mqtt://localhost",
  tableBase: [-0.69, -3.17, 2.4, 0, 0, 0],
};
