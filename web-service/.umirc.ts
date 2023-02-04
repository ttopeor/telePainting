import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: 'Mobility Lab Control',
  },
  routes: [
    {
      path: '/',
      redirect: '/robotarm',
    },
    {
      name: 'Robot Arm',
      path: '/robotarm',
      component: './RobotArm',
    },
    {
      name: 'Mobility Base',
      path: '/mobility-base',
      component: './MobilityBase',
    },
    {
      name: 'Configuration',
      path: '/configuration',
      component: './Config',
    },
    {
      name: 'Log',
      path: '/log',
      component: './Log',
    },
    {
      name: 'About',
      path: '/about',
      component: './About',
    },
  ],
  npmClient: 'yarn',
  proxy: {
    '/api': {
      target: 'http://localhost:8080/',
      changeOrigin: true,
    },
  },
});
