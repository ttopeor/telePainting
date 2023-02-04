import { useEffect, useRef } from 'react';
import React from 'react';

export interface SimulatorProp {
  current: number[];
  destination: number[][];
}

// export function Simulator(props: SimulatorProp) {
//   const ref = useRef<HTMLIFrameElement>(null);

//   useEffect(() => {
//     ref.current?.contentWindow?.postMessage({
//       name: 'ANGLE',
//       currentAngles: [15, 15, 15, 15, 15, 15],
//       destinationAngles: props.destination,
//     });
//   }, [props.current, props.destination]);

//   return <iframe src="urdf.html" style={{ width: '100%', height: '50vh' }} />;
// }

export class Simulator extends React.Component<SimulatorProp> {
  iframe: HTMLIFrameElement | null = null;
  onIframeStart(ref: HTMLIFrameElement | null) {
    if (!!ref) {
      this.iframe = ref;
    }
  }

  shouldComponentUpdate() {
    return false;
  }

  componentWillReceiveProps(
    nextProps: Readonly<SimulatorProp>,
    nextContext: any
  ): void {
    this.iframe?.contentWindow?.postMessage(
      {
        name: 'ANGLE',
        currentAngles: nextProps.current,
        destinationAngles: nextProps.destination,
      },
      '*'
    );
  }

  render() {
    return (
      <iframe
        src="urdf.html"
        style={{ width: '100%', height: '50vh' }}
        ref={(ref) => this.onIframeStart(ref)}
      />
    );
  }
}
