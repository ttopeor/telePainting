import { UseAbout } from '@/services/aboutService';

import { Descriptions } from 'antd';

export default () => {
  const about = UseAbout() as Record<string, any>;
  return (
    <Descriptions title="Environment" bordered>
      {Object.keys(about).map((k) => (
        <Descriptions.Item label={k} key={k}>
          {about[k].toString()}
        </Descriptions.Item>
      ))}
    </Descriptions>
  );
};
