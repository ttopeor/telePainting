import { useAr4State } from '@/models/ar4';
import { PageContainer } from '@ant-design/pro-components';
import styles from './index.less';
import { Card, Tabs, Row, Space, Tag, Alert, Button, Switch } from 'antd';
import { Dashboard } from './Dashboard';
import { Chart } from './Chart';
import { moduleRequest, request } from '@/services/moduleService';
import { Simulator } from '@/components/Simulator';
import { VRControl } from '@/components/VRControl';

function sendZeroAngles() {
  moduleRequest('ar4robotarm', 'Ar4TrajectoryController', [0, 0, 0, 0, 0, 0]);
}

function sendTestButton() {
  fetch('/api/test/test');
}

function sendEnable(enabled: boolean, reason: string) {
  request('/api/enabled', 'POST', { enabled, reason });
}

function sendBacktrackAngles() {
  moduleRequest(
    'ar4robotarm',
    'Ar4TrajectoryController',
    [0, 46, -48, 0, 0, 0]
  );
}

function sendEEF(checked: boolean) {
  moduleRequest('ar4robotarm', 'eef', checked ? 1 : 0);
}

function sendZeroPositionAngle() {
  moduleRequest(
    'ar4robotarm',
    'Ar4TrajectoryController',
    [
      -0.0, -29.860543139473563, -57.58315709757954, -0.0, -2.556299762946964,
      1.2722218725854062e-14,
    ]
  );
}

// function sendRestPositionAngle() {
//   client.publish('ar4/request/angles', JSON.stringify([0, 40, -36, 0, 0, 0]));
// }

// function sendZeroPositions() {
//   client.publish(
//     'ar4/request/positions',
//     JSON.stringify([[0, 0.3487, 0.4748, -Math.PI / 2, 0, -Math.PI / 2]])
//   );
// }

// function sendSquare() {
//   const ZERO_POSITION = [0, 0.207, 0.245];
//   const REFERENCE_POSITION = [
//     ZERO_POSITION[0] + 0,
//     ZERO_POSITION[1] + 0.15,
//     ZERO_POSITION[2] + 0,
//   ];
//   const directions = [
//     [-1, 0],
//     [1, 0],
//     [1, 1],
//     [-1, 1],
//   ];
//   const length_x = 0.17;
//   const length_y = 0.2;
//   const length_z = 0.05;
//   const coefficient = 0.8;
//   const positions = [];
//   for (let i = 0; i < 5; i++) {
//     for (const dir of directions) {
//       positions.push([
//         REFERENCE_POSITION[0] + dir[0] * length_x * coefficient ** i,
//         REFERENCE_POSITION[1] + dir[1] * length_y * coefficient ** i,
//         REFERENCE_POSITION[2] + length_z * i,
//         0,
//         0,
//         Math.PI / 2,
//       ]);
//     }
//   }
//   client.publish('ar4/request/positions', JSON.stringify(positions));
//   console.log(positions);
// }

// function sendTrajectory() {
//   client.publish('ar4/request/trajectory', JSON.stringify([]));
// }

// function sendJ7Enabled(e: any) {
//   if (!!e) {
//     client.publish('ar4/request/j7', '1');
//   } else {
//     client.publish('ar4/request/j7', '0');
//   }
// }

const HomePage: React.FC = () => {
  const [
    fps,
    enabled,
    hasUpdate,
    mode,
    sensorRate,
    currentAngles,
    destinationAngles,
  ] = useAr4State((state) => [
    state.status.fps,
    state.status.enabled,
    state.status.hasUpdate,
    state.status.mode,
    state.status.sensorRate,
    state.status.current,
    state.status.destination,
  ]);
  return (
    <PageContainer
      extra={[
        <Button
          key="enable"
          type="primary"
          onClick={() => sendEnable(true, '')}
          disabled={enabled}
        >
          Enable
        </Button>,
        <Button
          key="disable"
          type="primary"
          onClick={() => sendEnable(false, '网页锁定')}
          disabled={!enabled}
        >
          Disable
        </Button>,
      ]}
    >
      <div className={styles.container}>
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
          <h1>
            Controller: {mode} SensorRate:{' '}
            <span style={{ color: fps > 200 ? 'green' : 'red' }}>
              {sensorRate.toFixed(0)}
            </span>{' '}
          </h1>
          {!hasUpdate && <Alert type="error" message="No update from MQTT" />}

          <Card title="Quick Actions">
            <Space direction="vertical">
              <Space>
                {/* <div>
                  <span>
                    J7 Enabled:{' '}
                    <Switch
                      disabled={!hasUpdate}
                      onChange={(v) => sendJ7Enabled(v)}
                    />
                  </span>
                </div> */}
                <Button
                  type="primary"
                  onClick={sendZeroAngles}
                  disabled={!hasUpdate}
                >
                  Joint Zero
                </Button>
                <Button
                  type="primary"
                  onClick={sendZeroPositionAngle}
                  disabled={!hasUpdate}
                >
                  Coordinate Zero
                </Button>
                <Button
                  type="primary"
                  onClick={sendBacktrackAngles}
                  disabled={!hasUpdate}
                >
                  Backtrack
                </Button>
                <Button
                  type="primary"
                  onClick={sendTestButton}
                  disabled={!hasUpdate}
                >
                  Test Button
                </Button>
                <h4>End Effector</h4>
                <Switch onChange={sendEEF} />
              </Space>
              <Space>
                <VRControl />
              </Space>
            </Space>
          </Card>
          <Card>
            <Tabs
              defaultActiveKey="1"
              items={[
                {
                  label: 'Dashboard',
                  key: '1',
                  children: (
                    <div>
                      <Space
                        direction="vertical"
                        size="middle"
                        style={{ display: 'flex' }}
                      >
                        <Dashboard />
                      </Space>
                    </div>
                  ),
                },
                {
                  label: 'Plot',
                  key: '2',
                  children: <Chart />,
                },
                {
                  label: 'Simulator',
                  key: '3',
                  children: (
                    <Simulator
                      current={currentAngles}
                      destination={[destinationAngles]}
                    />
                  ),
                },
              ]}
            />
          </Card>
        </Space>
      </div>
    </PageContainer>
  );
};

export default HomePage;
