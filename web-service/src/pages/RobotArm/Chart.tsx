import { useAr4State } from '@/models/ar4';
import { Line } from '@ant-design/plots';
import {
  currentHistoricalData,
  destinationHistoricalData,
  toggleRecord,
} from '@/models/mqtt';
import ControlPad from '@/components/ControlPad';
import { Space, Col, Statistic, Row, Button } from 'antd';
import { useState } from 'react';
import React from 'react';

function ChartChildren() {
  const [current, hasUpdate, speed] = useAr4State((state) => [
    state.status.current,
    state.status.hasUpdate,
    state.status.jointSpeed,
  ]);

  const [displayJoint, setDisplayJoint] = useState(0);

  const data: any[] = [];

  for (let i = 0; i < currentHistoricalData.data.length; i++) {
    for (let j = 0; j < current.length; j++) {
      const time =
        '-' +
        (
          ((currentHistoricalData.data.length - i) *
            currentHistoricalData.data_interval) /
          1000
        ).toFixed(1) +
        's';
      if (displayJoint === 0 || displayJoint === j + 1) {
        data.push({
          time,
          angle: currentHistoricalData.data[i][j],
          category: 'current - J' + (j + 1).toString(),
        });
        data.push({
          time,
          angle: destinationHistoricalData.data[i][j],
          category: 'dest - J' + (j + 1).toString(),
        });
      }
    }
  }

  const config: any = {
    data,
    xField: 'time',
    yField: 'angle',
    seriesField: 'category',
    meta: {
      range: [-180, 180],
    },
    animation: false,
  };

  return (
    <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
      <Space style={{ display: 'flex' }}>
        <Button onClick={toggleRecord} type="primary" style={{ width: 120 }}>
          Toggle Record
        </Button>
        {current.map((_, i) => (
          <Button
            type="link"
            style={{ width: 120 }}
            onClick={() => {
              if (displayJoint === i + 1) {
                setDisplayJoint(0);
              } else {
                setDisplayJoint(i + 1);
              }
            }}
            key={i}
          >
            {displayJoint === i + 1 ? `Show All` : `Show J ${i + 1} Only`}
          </Button>
        ))}
      </Space>
      <Line {...config} />
      <Row gutter={4}>
        {speed.map((v, i) => (
          <Col md={8} lg={4} key={i}>
            <Statistic title={`Joint ${i + 1}`} value={v} precision={2} />
            <ControlPad jointId={i + 1} disabled={!hasUpdate} />
          </Col>
        ))}
      </Row>
    </Space>
  );
}
export const Chart = React.memo(ChartChildren);
