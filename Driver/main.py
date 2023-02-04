from flask import Flask, jsonify, request
import json
import _thread
import time
from paho.mqtt import client as mqtt_client
from robot import Robot
from tools.config import Config
from tools.ticker import Ticker
app = Flask(__name__)

Config.load()
print("AR4-MOD Driver")

mqtt = mqtt_client.Client()
mqtt.connect("localhost")


def onError(message):
    mqtt.publish('ar4/error', message)


robot = Robot("/dev/ttyACM0", onError)


def robotLoop():
    while True:
        robot.tick()


def mqttLoop():
    ticker = Ticker(Config.MQTTInterval)
    while True:
        mqtt.publish(
            "ar4/angles", json.dumps({"current": robot.currentAngles.tolist(),
                                      "destination": robot.destinationAngles.tolist(),
                                      "jointSpeed": robot.currentSpeed.tolist(),
                                      'currentPos': robot.currentCartesianPos.tolist(),
                                      'destinationPos': robot.destinationCartesianPos.tolist(),
                                      'tickRate': robot.tickRate}))
        mqtt.publish('ar4/enabled', robot.enabled)
        mqtt.publish('ar4/fps', str(round(robot.fps, 1)))
        mqtt.publish('ar4/mode', robot.mode)
        ticker.sleep_till_next_tick()


def mqttSubscribe():
    def on_message(client, userdata, msg):
        print("MQTT request", msg.topic)
        if msg.topic == 'ar4/request/j7':
            robot.J7Enabled = int(msg.payload)
        if msg.topic == 'ar4/request/speed':
            speeds = json.loads(msg.payload)
            robot.requestSpeed(speeds)
        if msg.topic == 'ar4/request/enable':
            robot.setEnable(True)
        if msg.topic == 'ar4/request/disable':
            robot.setEnable(False)
        if msg.topic == 'ar4/request/angles':
            angles = json.loads(msg.payload)
            robot.requestAngle(angles)
        if msg.topic == 'ar4/request/positions':
            try:
                positions = json.loads(msg.payload)
                robot.requestPositions(positions)
            except Exception as ex:
                print("Error on request position, %s" % ex)
                mqtt.publish(
                    'ar4/error', "Failed to execute positions: %s" % ex)
                robot.setEnable(False)
                robot.setEnable(True)
        if msg.topic == 'ar4/request/trajectory':
            try:
                trajectory = json.loads(msg.payload)
                robot.requestTrajectory(trajectory)
            except Exception as ex:
                print("Error on request trajectory, %s" % ex)
                mqtt.publish(
                    'ar4/error', "Failed to execute trajectory: %s" % ex)
                robot.setEnable(False)
                robot.setEnable(True)

    mqtt.subscribe("ar4/request/#")
    mqtt.on_message = on_message
    mqtt.loop_forever()


@app.route("/api/status")
def enabled():
    return jsonify({
        'enabled': robot.enabled,
        'current': robot.currentAngles.tolist(),
        'currentPos': robot.currentCartesianPos.tolist(),
        'destination': robot.destinationAngles.tolist(),
        'destinationPos': robot.destinationCartesianPos.tolist(),
        'jointSpeed': robot.currentSpeed.tolist(),
        'fps': robot.fps,
        'tickRate': robot.tickRate
    })


@app.route("/api/config")
def getConfig():
    return jsonify(Config.to_json())


@app.route("/api/config", methods=['POST'])
def saveConfig():
    newConfig = request.json
    Config.from_json(newConfig)
    Config.save()
    return jsonify(Config.to_json())


if __name__ == "__main__":
    from waitress import serve
    _thread.start_new_thread(robotLoop, ())
    _thread.start_new_thread(mqttLoop, ())
    _thread.start_new_thread(mqttSubscribe, ())

    serve(app, host="0.0.0.0", port=5000)
