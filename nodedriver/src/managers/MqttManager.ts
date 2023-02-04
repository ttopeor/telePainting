import mqtt, { MqttClient } from "mqtt";
import { LogManager_Instance } from ".";
import { Environment } from "../Environment";

export class MqttManager {
  private client: MqttClient | null = null;

  subscriptions: ((topic: string, payload: string) => void)[] = [];

  async start() {
    return new Promise((resolve) => {
      LogManager_Instance.logger.debug(
        `Connecting mqtt @ ${Environment.mqttAddress}`
      );
      this.client = mqtt.connect(Environment.mqttAddress);
      this.client.on("connect", () => {
        LogManager_Instance.logger.info(`Connect to mqtt success!`);
        this.client?.on("message", (topic, payload) => {
          this.subscriptions.forEach((s) => s(topic, payload.toString("utf8")));
        });
        resolve(null);
      });
    });
  }

  publish(topic: string, data: string | Buffer | Object) {
    if (this.client?.connected) {
      if (typeof data === "object") {
        this.client.publish(topic, JSON.stringify(data));
      } else {
        this.client.publish(topic, data);
      }
    }
  }

  register(topic: string, callback: (topic: string, payload: any) => void) {
    if (!this.client || !this.client.connected) {
      LogManager_Instance.logger.warn(
        `Failed to register mqtt callback[${topic}], client not ready!`
      );
    } else {
      this.client.subscribe(topic, (err: Error) => {
        if (!!err) {
          LogManager_Instance.logger.error(
            `Failed to subscribe topic: ${err.message}`
          );
        } else {
          this.subscriptions.push(callback);
        }
      });
    }
  }
}
