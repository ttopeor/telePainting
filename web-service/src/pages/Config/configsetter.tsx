import { useSerialPort } from '@/models/config';
import { ReloadOutlined } from '@ant-design/icons';
import {
  Row,
  Col,
  Space,
  InputNumber,
  Switch,
  Form,
  Button,
  Tabs,
  Select,
  Empty,
} from 'antd';
import FormBuilder from 'antd-form-builder';
import React, { useEffect, useState } from 'react';

export interface ConfigSetterProps {
  config: Record<string, any>;
  definition: Record<string, any>;
  onUpdate: (newConfig: Record<string, any>) => void;
}
const JointValueEditor = ({
  value,
  onChange,
}: {
  value: number[] | boolean[];
  onChange: Function;
}) => {
  return value ? (
    <Row gutter={4}>
      {value.map((v, i) => (
        <Col span={4} key={i}>
          <Space direction="horizontal" size={'middle'}>
            <h4>J{i + 1}</h4>
            {typeof v === 'number' ? (
              <InputNumber
                style={{ width: '100%' }}
                value={v}
                onChange={(nv) => {
                  const newValues = [...value];
                  newValues[i] = nv || 0;
                  onChange(newValues);
                }}
              />
            ) : (
              <Switch
                defaultChecked={v}
                onChange={(nv) => {
                  const newValues = [...value];
                  newValues[i] = nv || false;
                  onChange(newValues);
                }}
              />
            )}
          </Space>
        </Col>
      ))}
    </Row>
  ) : null;
};

const SerialEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange: Function;
}) => {
  const [ports, refresh] = useSerialPort() as any;

  return (
    <Space direction="horizontal">
      <Select
        style={{ width: 300 }}
        value={value}
        onChange={(newval) => onChange(newval)}
      >
        {ports.map((p: any) => (
          <Select.Option value={p.path} key={p.path}>
            {p.path} - {p.manufacturer || ''}
          </Select.Option>
        ))}
      </Select>
      <Button
        type="primary"
        icon={<ReloadOutlined />}
        onClick={refresh}
      ></Button>
    </Space>
  );
};

export enum ConfigType {
  BOOLEAN = 'BOOLEAN',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  JOINT_VALUES = 'JOINT_VALUES',
  JOINT_SWITCH = 'JOINT_SWITCH',
  SERIAL_PORT = 'SERIAL_PORT',
}

const WidgetMapping: any = {
  BOOLEAN: 'switch',
  NUMBER: 'number',
  STRING: 'input',
  JOINT_VALUES: JointValueEditor,
  JOINT_SWITCH: JointValueEditor,
  SERIAL_PORT: SerialEditor,
};

export function ConfigEditorSingle(props: ConfigSetterProps) {
  const [form] = Form.useForm();

  const meta = {
    columns: 3,
    initialValues: props.config,
    fields: Object.keys(props.definition).map((dk) => {
      const widget = WidgetMapping[props.definition[dk].type as string];
      return {
        required: true,
        key: dk,
        label: dk,
        widget: widget,
        default: props.definition[dk].default,
        colSpan: 3,
      };
    }),
  };

  const handleFinish = React.useCallback((values: any) => {
    props.onUpdate(values);
  }, []);

  useEffect(() => {
    form.resetFields();
  }, [props.config, form]);

  const hasConfig = Object.keys(props.definition).length > 0;

  return hasConfig ? (
    <Form onFinish={handleFinish} form={form}>
      <FormBuilder meta={meta} form={form} initialValues={props.config} />
      <Form.Item wrapperCol={{ span: 16, offset: 8 }}>
        <Space>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
          <Button onClick={() => form.resetFields()}>Reset</Button>
        </Space>
      </Form.Item>
    </Form>
  ) : (
    <Empty description="No configurable item for this entry" />
  );
}

export function ConfigSetterGroup(props: ConfigSetterProps) {
  const [activeTab, setActiveTab] = useState('1');
  return (
    <Tabs
      tabPosition="left"
      activeKey={activeTab}
      onChange={setActiveTab}
      items={Object.keys(props.definition).map((dk, i) => ({
        label: dk,
        key: (i + 1).toString(),
        children: (
          <ConfigEditorSingle
            config={props.config[dk]}
            definition={props.definition[dk]}
            onUpdate={(newConfig) => props.onUpdate({ [dk]: newConfig })}
          />
        ),
      }))}
    />
  );
}
