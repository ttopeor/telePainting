// 运行时配置
import logo from './assets/LOGO.png';
import { RunTimeLayoutConfig } from '@umijs/max';
import { RightContent } from './components/RightContent';
// 全局初始化数据配置，用于 Layout 用户信息和权限初始化
// 更多信息见文档：https://next.umijs.org/docs/api/runtime-config#getinitialstate
export async function getInitialState(): Promise<{ name: string }> {
  return { name: 'Mobility Lab Control' };
}

export const layout: RunTimeLayoutConfig = (initialState) => {
  return {
    logo,
    layout: 'top',
    rightContentRender: () => <RightContent />,
  };
};
