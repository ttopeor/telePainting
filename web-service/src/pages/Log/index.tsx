import { getLogList } from '@/services/logService';
import { useResource, useText } from '@/utils/request';
import { useRequest } from '@umijs/max';
import { Button, Card, List, message } from 'antd';
import { useEffect, useRef, useState } from 'react';

export default () => {
  const [data, loading] = useResource<string[]>('/api/logs', []);
  const [logFile, setLogFile] = useState('');
  const [logData, setLogData] = useState(
    'Click on list button to view log files'
  );

  useEffect(() => {
    if (logFile !== '') {
      fetch('/api/logs/' + logFile)
        .then((t) => t.text())
        .then((data) => {
          setLogData(data);
        })
        .catch((e) => {
          message.error('Failed to fetch log file: ' + e.message);
        });
    }
  }, [logFile]);
  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <Card
        title="Log List"
        style={{ width: '30%', margin: 10 }}
        loading={loading as boolean}
      >
        <List
          dataSource={data as any as string[]}
          renderItem={(item: string) => (
            <List.Item
              title={item}
              key={item}
              extra={[
                <Button
                  type="primary"
                  key={'view'}
                  onClick={() => {
                    setLogFile(item);
                  }}
                >
                  View
                </Button>,
              ]}
            >
              <h3>{item}</h3>
            </List.Item>
          )}
        />
      </Card>
      <Card
        title="Log Content"
        style={{
          flex: 1,
          margin: 10,
          height: '85vh',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            backgroundColor: 'black',
            color: 'white',
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {logData.split('\n').map((line, i) => (
            <code
              key={i}
              style={{
                color: line.match(/\[error\]/g)
                  ? 'red'
                  : line.match(/\[debug\]/g)
                  ? 'teal'
                  : line.match(/\[warn\]/g)
                  ? 'yellow'
                  : 'green',
              }}
            >
              {line}
            </code>
          ))}
        </div>
      </Card>
    </div>
  );
};
