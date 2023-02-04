import requests
import time

while True:
    resp = requests.get("http://localhost:5000/angle")
    a = resp.json()
