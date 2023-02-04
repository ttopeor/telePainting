import json
from os.path import join, realpath, dirname
from utility import get_path
CONFIG_PATH = 'config'

SETUP_CONFIG_PATH = get_path(join(CONFIG_PATH, 'setup.json'))


def load_json(file_path):
    with open(file_path) as f:
        js = json.load(f)
    return js


if __name__ == "__main__":
    setup = load_json(SETUP_CONFIG_PATH)
    print(setup)
