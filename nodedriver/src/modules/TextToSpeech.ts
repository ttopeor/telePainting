import fetch from "node-fetch";
import { join } from "path";
import { ConfigDefinitions } from "../definitions/config";
import { IModule } from "../definitions/IModule";
import { Environment } from "../Environment";
import { ensureExists } from "../utils";
import crypto from "crypto";
//@ts-ignore
import player from "node-wav-player";
import { writeFile } from "fs/promises";
import { App } from "../App";
import { LogManager_Instance } from "../managers";
import { existsSync } from "fs";

const SPEECH_FOLDER = join(Environment.dataPath, "speech");
ensureExists(SPEECH_FOLDER);

export class TextToSpeech implements IModule {
  start() {
    return Promise.resolve();
  }
  tick(): void {}
  status: any = {};
  async request(type: string, input: any): Promise<void> {
    if (type === "tts") {
      const md5 = crypto.createHash("md5");
      const file = md5.update(input).digest("hex") + ".wav";
      const file_path = join(SPEECH_FOLDER, file);
      LogManager_Instance.logger.info(`Speech: ${input}`);
      if (!existsSync(file_path)) {
        await fetch("http://home100-server:9900/speech?text=" + input)
          .then((x) => x.arrayBuffer())
          .then((x) => writeFile(file_path, Buffer.from(x)))
          .then(() => player.play({ path: file_path, sync: true }))
          .catch((e) => [
            LogManager_Instance.logger.error(
              `Failed to request tts service: ${e.message}`
            ),
          ]);
      } else {
        await player.play({ path: file_path, sync: true });
      }
    }
  }
  configDefinitions(): ConfigDefinitions {
    return {};
  }
  static async speak(text: string) {
    const module = App.instance.getModuleByName("texttospeech") as TextToSpeech;
    if (!!module) {
      await module.request("tts", text);
    }
  }
}
