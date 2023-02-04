import React from 'react'
import ControlPad from "@/components/ControlPad";
import { Card, Row, Col, Statistic, Tag } from "antd";

import { useAr4State } from '@/models/ar4';

export function Dashboard() {
  const [current, destination, speed, hasUpdate, currentPos, destinationPos] = useAr4State(state => [
    state.status.current,
    state.status.destination,
    state.status.jointSpeed,
    state.status.hasUpdate,
    state.status.currentPos,
    state.status.destinationPos,
  ]);

  return (<React.Fragment>

    <Card title="Current Join Value" extra={[<h3>Cartisan: {`Position:(${currentPos[0].toFixed(2)}, ${currentPos[1].toFixed(2)}, ${currentPos[2].toFixed(2)}) Rotation: (${currentPos[3].toFixed(2)}, ${currentPos[4].toFixed(2)}, ${currentPos[5].toFixed(2)}) `}</h3>]}>
      <Row gutter={4}>
        {
          current.map((v, i) => (
            <Col md={8} lg={4} key={i} > <Statistic title={`Joint ${i + 1}`} value={v} precision={2} /></Col>
          ))
        }
      </Row>
    </Card>
    <Card title="Destination Join Value" extra={[<h3>Cartisan: {`Position:(${destinationPos[0].toFixed(2)}, ${destinationPos[1].toFixed(2)}, ${destinationPos[2].toFixed(2)}) Rotation: (${destinationPos[3].toFixed(2)}, ${destinationPos[4].toFixed(2)}, ${destinationPos[5].toFixed(2)}) `}</h3>]}>
      <Row gutter={4}>
        {
          destination.map((v, i) => (
            <Col md={8} lg={4} key={i}><Statistic title={`Joint ${i + 1}`} value={v} precision={2} /></Col>
          ))
        }
      </Row>
    </Card>
    <Card title="Joint Speed">
      <Row gutter={4}>
        {
          speed.map((v, i) => (
            <Col md={8} lg={4} key={i}><Statistic title={`Joint ${i + 1}`} value={v} precision={2} /><ControlPad jointId={i + 1} disabled={!hasUpdate} /></Col>
          ))
        }
      </Row>
    </Card>
  </React.Fragment>)
}