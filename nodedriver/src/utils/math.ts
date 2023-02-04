import * as nj from "numjs";
//@ts-ignore
import matrixInverse from "matrix-inverse";

export function degreeToRad(angle: number): number {
  return (angle / 180) * Math.PI;
}

export function radToDegree(rad: number): number {
  return (rad / Math.PI) * 180;
}

export function transformMatrix(
  x: number,
  y: number,
  z: number,
  roll: number,
  pitch: number,
  yaw: number
) {
  // Create rotation matrices for roll, pitch, and yaw
  const R_x = nj.array(
    [
      [1, 0, 0],
      [0, Math.cos(roll), -Math.sin(roll)],
      [0, Math.sin(roll), Math.cos(roll)],
    ],
    "float32"
  );
  const R_y = nj.array(
    [
      [Math.cos(pitch), 0, Math.sin(pitch)],
      [0, 1, 0],
      [-Math.sin(pitch), 0, Math.cos(pitch)],
    ],
    "float32"
  );
  const R_z = nj.array(
    [
      [Math.cos(yaw), -Math.sin(yaw), 0],
      [Math.sin(yaw), Math.cos(yaw), 0],
      [0, 0, 1],
    ],
    "float32"
  );

  // Compute the transformation matrix
  const R = R_z.dot(R_y.dot(R_x)).tolist();
  for (let i = 0; i < 3; i++) {
    R[i].push([x, y, z][i]);
  }
  R.push([0, 0, 0, 1]);

  return nj.array(R, "float32");
}

export function transformToXYZRPY(transform: nj.NdArray<number>): number[] {
  // Extract the rotation matrix and translation vector from the transformation matrix

  const T = transform.slice([0, 3], [3, 1]);

  console.log("T", T.tolist());
  // Extract the x, y, and z values from the translation vector
  const x = T.get(0, 0);
  const y = T.get(1, 0);
  const z = T.get(2, 0);

  // Compute the roll, pitch, and yaw angles from the rotation matrix
  const roll = Math.atan2(transform.get(2, 1), transform.get(2, 2));
  const pitch = Math.asin(-transform.get(2, 0));
  const yaw = Math.atan2(transform.get(1, 0), transform.get(0, 0));

  return [x, y, z, roll, pitch, yaw];
}
export function rpyToQuat(roll: number, pitch: number, yaw: number): number[] {
  roll = roll;
  pitch = pitch;
  yaw = yaw;

  // Compute the quaternion using the roll, pitch, and yaw angles
  const quat = [
    Math.cos(yaw / 2) * Math.cos(pitch / 2) * Math.cos(roll / 2) +
      Math.sin(yaw / 2) * Math.sin(pitch / 2) * Math.sin(roll / 2),
    Math.sin(yaw / 2) * Math.cos(pitch / 2) * Math.cos(roll / 2) -
      Math.cos(yaw / 2) * Math.sin(pitch / 2) * Math.sin(roll / 2),
    Math.cos(yaw / 2) * Math.sin(pitch / 2) * Math.cos(roll / 2) +
      Math.sin(yaw / 2) * Math.cos(pitch / 2) * Math.sin(roll / 2),
    Math.cos(yaw / 2) * Math.cos(pitch / 2) * Math.sin(roll / 2) -
      Math.sin(yaw / 2) * Math.sin(pitch / 2) * Math.cos(roll / 2),
  ];
  return quat;
}

export function getBaseTool(global_base: number[], global_tool: any) {
  const x = -global_tool[0] / 100 + global_base[0];
  const y = global_tool[1] / 100 - global_base[1];
  const z = global_tool[2] / 100 - global_base[2];

  const roll = -global_tool[3];
  const pitch = global_tool[4];
  const yaw = -global_tool[5];

  return {
    position: { x, y, z },
    orientation: { roll, pitch, yaw }, //{ x: quat[0], y: quat[1], z: quat[2], w: quat[3] },
  };
}
