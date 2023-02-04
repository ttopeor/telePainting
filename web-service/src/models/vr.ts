import { request } from '@/services/moduleService';
import { useEffect, useState } from 'react';

export function useVRFiles() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const res = await request('/api/vr');
    setFiles(res);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return [files, loading, refresh];
}
