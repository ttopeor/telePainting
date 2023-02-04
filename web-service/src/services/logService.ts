export function getLogList() {
  return fetch('/api/logs').then((j) => j.json());
}
