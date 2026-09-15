import React from 'react';
import { MeshDistortMaterial, Sphere } from '@react-three/drei';

export default function AvatarModel() {
  return (
    <Sphere args={[1, 32, 32]} position={[0, 0, 0]}>
      <MeshDistortMaterial
        color="#00FFF7"
        distort={0.4}
        speed={2}
        emissive="#FF00EA"
        emissiveIntensity={0.8}
      />
    </Sphere>
  );
}
