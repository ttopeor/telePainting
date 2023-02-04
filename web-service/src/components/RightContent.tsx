import { useAr4State } from '@/models/ar4';
import { useTaskStatus } from '@/models/task';
import { ContainerOutlined } from '@ant-design/icons';
import { Progress, Space, Tag } from 'antd';

export function RightContent() {
  const [fps, enabled] = useAr4State((state) => [
    state.status.fps,
    state.status.enabled,
  ]);
  const taskStatus = useTaskStatus((state) => state.status);

  return (
    <Space direction="horizontal" style={{ marginRight: 38 }}>
      <Space direction="horizontal">
        {taskStatus.status.total > 0 && (
          <Progress
            percent={
              (taskStatus.status.current / taskStatus.status.total) * 100
            }
            format={() =>
              `${taskStatus.status.current} / ${taskStatus.status.total}`
            }
            style={{ width: 200, paddingRight: 20 }}
          />
        )}
        <Tag color="blue">
          {taskStatus.runningTask}:{taskStatus.status.stat}
        </Tag>
      </Space>

      {enabled ? (
        <Tag color="green">Enabled</Tag>
      ) : (
        <Tag color="red">Disabled</Tag>
      )}
      <code
        style={{
          color: fps > 200 ? 'green' : 'red',
          fontSize: 28,
          fontWeight: '700',
        }}
      >
        FPS: {fps.toFixed(0)}
      </code>
    </Space>
  );
}
