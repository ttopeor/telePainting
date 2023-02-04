import { useConfig } from '@/models/config';
import { ReloadOutlined } from '@ant-design/icons';
import { Button, Skeleton, Space, Tabs } from 'antd';
import { ConfigEditorSingle, ConfigSetterGroup } from './configsetter';

export default () => {
  const [config, definition, loading, refresh, update] = useConfig() as any;

  return (
    <>
      <Space>
        <h1>Configuration</h1>
        <Button onClick={refresh} icon={<ReloadOutlined />} />
      </Space>
      <Skeleton loading={loading}>
        <Tabs
          defaultActiveKey="1"
          style={{ marginTop: 20 }}
          items={[
            {
              label: `General`,
              key: '1',
              children: (
                <ConfigEditorSingle
                  config={config.general}
                  definition={definition.general}
                  onUpdate={(newConfig) => update({ general: newConfig })}
                />
              ),
            },
            {
              label: `Modules`,
              key: '2',
              children: (
                <ConfigSetterGroup
                  config={config.modules}
                  definition={definition.modules}
                  onUpdate={(newConfig) => update({ modules: newConfig })}
                />
              ),
            },
            {
              label: `Controllers`,
              key: '3',
              children: (
                <ConfigSetterGroup
                  config={config.controllers}
                  definition={definition.controllers}
                  onUpdate={(newConfig) => update({ controllers: newConfig })}
                />
              ),
            },
            {
              label: `Rules`,
              key: '4',
              children: (
                <ConfigSetterGroup
                  config={config.rules}
                  definition={definition.rules}
                  onUpdate={(newConfig) => update({ rules: newConfig })}
                />
              ),
            },
          ]}
        />
      </Skeleton>
    </>
  );
};
