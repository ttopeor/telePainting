import { useVRFiles } from '@/models/vr';
import { request } from '@/services/moduleService';
import { ReloadOutlined, RightCircleOutlined } from '@ant-design/icons';
import { Button, Select, Space } from 'antd';
import { useState } from 'react';

export function VRControl() {
  const [files, loading, refresh] = useVRFiles() as any;
  const [currSelect, setCurrSelect] = useState('');

  const run = (file: string) => {
    if (!!file) {
      request('/api/vr/plan?name=' + file);
    }
  };

  return (
    <Space direction="horizontal">
      <span style={{ fontSize: 18, fontWeight: 700 }}>Run VR Record</span>
      <Select
        onChange={setCurrSelect}
        style={{ width: 200 }}
        options={files.map((f: string) => {
          return { label: f, value: f };
        })}
      ></Select>
      <Button
        onClick={() => run(currSelect)}
        icon={<RightCircleOutlined />}
      ></Button>
      <Button onClick={refresh} icon={<ReloadOutlined />}></Button>
    </Space>
  );
}
