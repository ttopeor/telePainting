import { notification } from 'antd';

export async function request(url: string, method = 'GET', payload: any = {}) {
  if (method === 'GET') {
    return fetch(url)
      .then((j) => j.json())
      .catch((e) => {
        console.error(`Failed to fetch ${url}: ${e.message}`);
        notification.error({ message: `Failed to fetch ${url}: ${e.message}` });
      });
  } else {
    return fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    })
      .then((j) => j.json())
      .catch((e) => {
        console.error(`Failed to fetch ${url}: ${e.message}`);
        notification.error({ message: `Failed to fetch ${url}: ${e.message}` });
      });
  }
}

export async function moduleRequest(module1: string, type: string, input: any) {
  return request(`/api/modules/${module1}/request`, 'POST', { type, input });
}
