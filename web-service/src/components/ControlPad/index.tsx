import React, { useCallback } from 'react';
import { Button, Space } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { client } from '@/models/ar4';
import { moduleRequest } from '@/services/moduleService';

export interface ControlPadProps {
  jointId: number;
  disabled: boolean;
}

const SPEED = 500;

export default function (props: ControlPadProps) {
  const setSpeed = useCallback(
    (speed: number) => {
      const speeds = [0, 0, 0, 0, 0, 0];
      speeds[props.jointId - 1] = speed;
      moduleRequest('ar4robotarm', 'Ar4ConstantSpeedController', speeds);
    },
    [props.jointId]
  );

  return (
    <Space>
      <Button
        disabled={props.disabled}
        type="primary"
        size="large"
        icon={<MinusOutlined />}
        onMouseUp={() => setSpeed(0)}
        onTouchEnd={() => setSpeed(0)}
        onTouchStart={() => setSpeed(-SPEED * 2)}
        onMouseDown={() => setSpeed(-SPEED * 2)}
      ></Button>
      <Button
        disabled={props.disabled}
        type="primary"
        size="large"
        icon={<PlusOutlined />}
        onMouseUp={() => setSpeed(0)}
        onTouchEnd={() => setSpeed(0)}
        onTouchStart={() => setSpeed(SPEED * 2)}
        onMouseDown={() => setSpeed(SPEED * 2)}
      ></Button>
    </Space>
  );
}
