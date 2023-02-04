import { request } from '@/services/moduleService';
import { notification } from 'antd';
import { useCallback, useEffect, useState } from 'react';

export function useSerialPort() {
  const [ports, setPorts] = useState([]);

  const refresh = async () => {
    const res = await request('/api/serialports');
    setPorts(res);
  };

  useEffect(() => {
    refresh();
  }, []);

  return [ports, refresh];
}

export function useConfig() {
  const [config, setConfig] = useState({
    modules: {},
    controllers: {},
    rules: {},
    general: {},
  });

  const [definition, setDefinition] = useState({
    modules: {},
    controllers: {},
    rules: {},
    general: {},
  });

  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const res = (await request('/api/config')) as any;
    setConfig(res.config);
    setDefinition(res.definition);
    setLoading(false);
  };

  const update = async (newConfig: any) => {
    const res = (await request('/api/config', 'POST', newConfig)) as any;
    setConfig(res.config);
    setDefinition(res.definition);
    notification.success({ message: 'Update config success' });
  };

  useEffect(() => {
    refresh();
  }, []);

  return [config, definition, loading, refresh, update];
}
