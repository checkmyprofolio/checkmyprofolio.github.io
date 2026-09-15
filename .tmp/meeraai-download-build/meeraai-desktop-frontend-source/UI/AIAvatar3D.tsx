import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';

const AvatarModel = React.lazy(() => import('./AvatarModel'));

export const AIAvatar3D = () => (
  <div style={{ width: 200, height: 200 }}>
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Suspense fallback={<Html center>Loading...</Html>}>
        <AvatarModel />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  </div>
);
