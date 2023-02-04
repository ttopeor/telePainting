import { message } from 'antd';
import { useEffect, useState } from 'react';

export function useText(url: string) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  useEffect(() => {
    if (url !== '') {
      setLoading(true);
      fetch(url)
        .then((j) => j.json())
        .then((data) => {
          setResult(data);
        })
        .catch((e) => {
          message.error(e.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [url]);
  return [result, loading];
}

export function useResource<T>(
  url: string,
  defaultValue: T,
  method = 'GET',
  payload: Object = {}
) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<T>(defaultValue);

  useEffect(() => {
    setLoading(true);
    if (method === 'GET') {
      fetch(url)
        .then((j) => j.json())
        .then((data) => {
          setResult(data);
        })
        .catch((e) => {
          message.error(e.message);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then((j) => j.json())
        .then((data) => {
          setResult(data);
        })
        .catch((e) => {
          message.error(e.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [url]);

  return [result, loading];
}
