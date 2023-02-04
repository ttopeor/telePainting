import time


class Ticker:
    def __init__(self, interval) -> None:
        self.interval = interval
        self.last_tick = 0

    def shouldTick(self):
        curr = time.time()

        if curr - self.last_tick >= self.interval:
            self.last_tick = curr
            return True

        return False

    def sleep_till_next_tick(self):
        curr = time.time()
        elasped = curr - self.last_tick
        if elasped < self.interval:
            time.sleep(self.interval - elasped)
        self.last_tick = time.time()
        return
