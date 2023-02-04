import { notification } from 'antd';
import { useEffect, useState } from 'react';

export function UseAbout() {
  const [about, setAbout] = useState({});
  useEffect(() => {
    fetch('/api/environment')
      .then((j) => j.json())
      .then(setAbout)
      .catch((e) =>
        notification.error({
          message: `Failed to fetch environment: ${e.message}`,
        })
      );
  }, []);
  return about;
}
