import React, { useState, useEffect, useRef } from 'react';
import type { DiceData, CanvasSettings } from '../../services/storage/types';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text as DreiText, Html, RoundedBox, Edges, Decal } from '@react-three/drei';
import { ArrowClockwise20Regular } from '@fluentui/react-icons';
import * as THREE from 'three';

const faceValuesCache: Record<number, number[]> = {};

const getCachedFaceValuesMap = (sides: number): number[] => {
  if (faceValuesCache[sides]) return faceValuesCache[sides];

  if (sides === 6) {
    faceValuesCache[sides] = [1, 2, 6, 5, 3, 4];
    return faceValuesCache[sides];
  }
  if (sides === 4) {
    faceValuesCache[sides] = [1, 2, 3, 4];
    return faceValuesCache[sides];
  }

  let geom: THREE.BufferGeometry;
  if (sides === 8) geom = new THREE.OctahedronGeometry(2);
  else if (sides === 12) geom = new THREE.DodecahedronGeometry(2);
  else if (sides === 20) geom = new THREE.IcosahedronGeometry(2);
  else {
    faceValuesCache[sides] = Array.from({ length: sides }).map((_, i) => i + 1);
    return faceValuesCache[sides];
  }

  geom.computeVertexNormals();
  const pos = geom.getAttribute('position');
  const index = geom.getIndex();
  const count = index ? index.count : pos.count;
  const uniqueFaces: { normal: THREE.Vector3 }[] = [];

  for (let i = 0; i < count; i += 3) {
    const a = index ? index.getX(i) : i;
    const b = index ? index.getX(i+1) : i+1;
    const c = index ? index.getX(i+2) : i+2;
    const vA = new THREE.Vector3().fromBufferAttribute(pos as any, a);
    const vB = new THREE.Vector3().fromBufferAttribute(pos as any, b);
    const vC = new THREE.Vector3().fromBufferAttribute(pos as any, c);
    const cb = new THREE.Vector3().subVectors(vC, vB);
    const ab = new THREE.Vector3().subVectors(vA, vB);
    const normal = cb.cross(ab).normalize();
    
    let found = false;
    for (const uf of uniqueFaces) {
      if (uf.normal.dot(normal) > 0.99) { found = true; break; }
    }
    if (!found) uniqueFaces.push({ normal });
  }

  const faceValues = new Array(sides).fill(0);
  let nextLow = 1;
  let nextHigh = sides;

  for (let i = 0; i < sides; i++) {
    if (i >= uniqueFaces.length) break;
    if (faceValues[i] !== 0) continue;

    let oppositeIdx = -1;
    for (let j = i + 1; j < sides; j++) {
      if (j >= uniqueFaces.length) break;
      if (faceValues[j] === 0 && uniqueFaces[i].normal.dot(uniqueFaces[j].normal) < -0.98) {
        oppositeIdx = j;
        break;
      }
    }

    faceValues[i] = nextLow++;
    if (oppositeIdx !== -1) {
      faceValues[oppositeIdx] = nextHigh--;
    }
  }

  faceValuesCache[sides] = faceValues;
  return faceValues;
};

interface DicesWorkspaceProps {
  boardDicesData: Record<string, DiceData>;
  selectedDiceId: string | null;
  setSelectedDiceId: (id: string | null) => void;
  onDuplicateDice: (id: string) => void;
  onDiceFaceDoubleClick?: (diceId: string, faceIndex: number) => void;
  canvasSettings?: CanvasSettings;
}

const FaceImageDecal: React.FC<{ url: string; scale: number; centroid: THREE.Vector3; quaternion: THREE.Quaternion; onDoubleClick?: () => void }> = ({ url, scale, centroid, quaternion, onDoubleClick }) => {
  const [texture, setTexture] = React.useState<THREE.Texture | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    const loader = new THREE.TextureLoader();
    loader.load(url, (tex) => {
      if (!isMounted) return;
      tex.colorSpace = THREE.SRGBColorSpace;
      setTexture(tex);
    });
    return () => { isMounted = false; };
  }, [url]);

  if (!texture) return null;

  const aspect = texture.image ? texture.image.width / texture.image.height : 1;
  let w = 2.5 * scale;
  let h = 2.5 * scale;
  if (aspect > 1) {
    h = w / aspect;
  } else {
    w = h * aspect;
  }

  const euler = new THREE.Euler().setFromQuaternion(quaternion);

  return (
    <Decal 
      position={centroid} 
      rotation={[euler.x, euler.y, euler.z]} 
      scale={[w, h, 0.5]}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.(); }}
    >
      <meshBasicMaterial 
        map={texture} 
        transparent 
        alphaTest={0.01} 
        polygonOffset 
        polygonOffsetFactor={-1}
      />
    </Decal>
  );
};

export const Dice3D: React.FC<{ dice: DiceData; selected: boolean; onClick: () => void; onDoubleClick?: (faceIndex: number) => void }> = ({ dice, selected, onClick, onDoubleClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const geometry = React.useMemo(() => {
    let geom: THREE.BufferGeometry;
    if (dice.sides === 2) geom = new THREE.CylinderGeometry(2, 2, 0.2, 32);
    else if (dice.sides === 4) geom = new THREE.TetrahedronGeometry(2);
    else if (dice.sides === 6) geom = new THREE.BoxGeometry(3, 3, 3);
    else if (dice.sides === 8) geom = new THREE.OctahedronGeometry(2);
    else if (dice.sides === 12) geom = new THREE.DodecahedronGeometry(2);
    else if (dice.sides === 20) geom = new THREE.IcosahedronGeometry(2);
    else if (dice.sides >= 1000) geom = new THREE.SphereGeometry(2, 32, 32);
    else geom = new THREE.CylinderGeometry(2, 2, 3, dice.sides);
    geom.computeVertexNormals();
    return geom;
  }, [dice.sides]);

  const faceData = React.useMemo(() => {
    const valuesMap = getCachedFaceValuesMap(dice.sides);

    if (dice.sides === 6) {
      return [
        { centroid: new THREE.Vector3(0, 0, 1.51), quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)), faceIndex: 1, faceValue: valuesMap[0] },
        { centroid: new THREE.Vector3(1.51, 0, 0), quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)), faceIndex: 2, faceValue: valuesMap[1] },
        { centroid: new THREE.Vector3(0, 0, -1.51), quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)), faceIndex: 3, faceValue: valuesMap[2] },
        { centroid: new THREE.Vector3(-1.51, 0, 0), quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0)), faceIndex: 4, faceValue: valuesMap[3] },
        { centroid: new THREE.Vector3(0, 1.51, 0), quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), faceIndex: 5, faceValue: valuesMap[4] },
        { centroid: new THREE.Vector3(0, -1.51, 0), quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), faceIndex: 6, faceValue: valuesMap[5] },
      ];
    }

    const data: { centroid: THREE.Vector3; quaternion: THREE.Quaternion; faceIndex: number; faceValue: number }[] = [];
    const pos = geometry.getAttribute('position');
    const index = geometry.getIndex();
    
    if (dice.sides > 20) return [];

    const count = index ? index.count : pos.count;
    const uniqueFaces: { normal: THREE.Vector3, centroids: THREE.Vector3[] }[] = [];

    for (let i = 0; i < count; i += 3) {
      const a = index ? index.getX(i) : i;
      const b = index ? index.getX(i+1) : i+1;
      const c = index ? index.getX(i+2) : i+2;

      const vA = new THREE.Vector3().fromBufferAttribute(pos, a);
      const vB = new THREE.Vector3().fromBufferAttribute(pos, b);
      const vC = new THREE.Vector3().fromBufferAttribute(pos, c);

      const centroid = new THREE.Vector3().addVectors(vA, vB).add(vC).divideScalar(3);
      
      const cb = new THREE.Vector3().subVectors(vC, vB);
      const ab = new THREE.Vector3().subVectors(vA, vB);
      const normal = cb.cross(ab).normalize();

      let found = false;
      for (const uf of uniqueFaces) {
        if (uf.normal.dot(normal) > 0.99) {
          uf.centroids.push(centroid);
          found = true;
          break;
        }
      }
      if (!found) {
        uniqueFaces.push({ normal, centroids: [centroid] });
      }
    }

    uniqueFaces.forEach((uf, i) => {
      if (i >= dice.sides) return;
      const faceCentroid = new THREE.Vector3();
      uf.centroids.forEach(c => faceCentroid.add(c));
      faceCentroid.divideScalar(uf.centroids.length);

      faceCentroid.add(uf.normal.clone().multiplyScalar(0.01));
      const target = faceCentroid.clone().sub(uf.normal);
      const up = Math.abs(uf.normal.y) > 0.99 ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0);
      const matrix = new THREE.Matrix4().lookAt(faceCentroid, target, up);
      const quaternion = new THREE.Quaternion().setFromRotationMatrix(matrix);

      data.push({ centroid: faceCentroid, quaternion, faceIndex: i + 1, faceValue: valuesMap[i] || (i + 1) });
    });

    return data;
  }, [geometry, dice.sides]);

  const renderContent = () => faceData.map((f, i) => {
    const faceConfig = dice.faces[f.faceIndex] || {};
    const val = faceConfig.text !== undefined ? faceConfig.text : (dice.startNumber + (f.faceValue - 1) * dice.stepDistance).toString();
    const color = faceConfig.contentColor || dice.pipColor;
    
    const isImage = dice.template === 'Images' || faceConfig.imageSrc;
    const isDots = dice.template === 'Dots' && !faceConfig.imageSrc && !faceConfig.text;
    
    let content;
    if (isImage && faceConfig.imageSrc) {
      const scale = faceConfig.imageScale ?? 1;
      return <FaceImageDecal key={i} url={faceConfig.imageSrc} scale={scale} centroid={f.centroid} quaternion={f.quaternion} onDoubleClick={() => onDoubleClick?.(f.faceIndex)} />;
    } else if (isDots && parseInt(val) <= 9) {
       const dotVal = parseInt(val);
       const getDotOffsets = () => {
         const o = 0.7; // offset
         switch (dotVal) {
           case 1: return [[0,0]];
           case 2: return [[-o, o], [o, -o]];
           case 3: return [[-o, o], [0,0], [o, -o]];
           case 4: return [[-o, o], [o, o], [-o, -o], [o, -o]];
           case 5: return [[-o, o], [o, o], [0,0], [-o, -o], [o, -o]];
           case 6: return [[-o, o], [o, o], [-o, 0], [o, 0], [-o, -o], [o, -o]];
           case 7: return [[-o, o], [o, o], [-o, 0], [0,0], [o, 0], [-o, -o], [o, -o]];
           case 8: return [[-o, o], [0, o], [o, o], [-o, 0], [o, 0], [-o, -o], [0, -o], [o, -o]];
           case 9: return [[-o, o], [0, o], [o, o], [-o, 0], [0,0], [o, 0], [-o, -o], [0, -o], [o, -o]];
           default: return [];
         }
       };
       content = getDotOffsets().map((offset, idx) => (
         <mesh key={idx} position={[offset[0], offset[1], 0]}>
           <circleGeometry args={[0.25, 32]} />
           <meshBasicMaterial color={color} />
         </mesh>
       ));
    } else {
       content = (
         <DreiText fontSize={(dice.fontSize || 24) * 0.0375} color={color} anchorX="center" anchorY="middle" rotation={[0, 0, 0]} font={dice.fontFamily === 'Inter' ? undefined : undefined}>
            {val}
         </DreiText>
       );
    }

    return (
      <group key={i} position={f.centroid} quaternion={f.quaternion}>
        {content}
        <mesh 
          position={[0, 0, 0.01]} 
          onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.(f.faceIndex); }}
        >
          <planeGeometry args={[2.5, 2.5]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    );
  });

  if (dice.sides === 6) {
    return (
      <RoundedBox 
        args={[3, 3, 3]} 
        radius={dice.rounded ? dice.rounded / 20 : 0.05} 
        smoothness={4} 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        <meshStandardMaterial color={dice.baseColor} roughness={0.4} metalness={0.1} />
        {renderContent()}
        {(dice.edgeSize || 0) > 0 && (
          <mesh>
            <boxGeometry args={[3, 3, 3]} />
            <meshBasicMaterial transparent opacity={0} />
            <Edges threshold={15} linewidth={dice.edgeSize} color={dice.edgeColor || '#000000'} />
          </mesh>
        )}
      </RoundedBox>
    );
  }

  return (
    <mesh ref={meshRef} geometry={geometry} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <meshStandardMaterial color={dice.baseColor} roughness={0.4} metalness={0.1} />
      {renderContent()}
      {(dice.edgeSize || 0) > 0 && <Edges linewidth={dice.edgeSize} color={dice.edgeColor || '#000000'} />}
      {selected && dice.sides !== 6 && (
        <lineSegments>
          <edgesGeometry args={[geometry]} />
          <lineBasicMaterial color="#a855f7" linewidth={2} />
        </lineSegments>
      )}
    </mesh>
  );
};



const Dice2D: React.FC<{ dice: DiceData; selected: boolean; onClick: () => void }> = ({ dice, selected, onClick }) => {
  const [rotation, setRotation] = useState(0);

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`relative w-40 h-48 flex flex-col items-center gap-3 cursor-pointer transition-all rounded-lg p-4 ${
        selected ? 'bg-meevo-surface-0 border border-meevo-border' : 'border border-transparent hover:border-[#CCCCCC]/30'
      }`}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); setRotation(r => r - Math.PI / 2); }}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-black/40 hover:bg-black/60 text-meevo-text-secondary hover:text-meevo-text-primary transition-colors z-10 pointer-events-auto"
        title="Rotate Dice"
      >
        <ArrowClockwise20Regular fontSize={16} />
      </button>
      <div className="w-full flex-1 pointer-events-none flex items-center justify-center relative">
        <Canvas orthographic camera={{ position: [10, 10, 10], zoom: 18, near: -100, far: 100 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.2} />
          <group rotation={[0, rotation, 0]}>
            <Dice3D dice={dice} selected={false} onClick={() => {}} />
          </group>
        </Canvas>
      </div>
      <div className="text-sm font-medium text-meevo-text-secondary text-center truncate w-full">
        {dice.name}
      </div>
    </div>
  );
};


export const DicesWorkspace: React.FC<DicesWorkspaceProps> = ({ boardDicesData, selectedDiceId, setSelectedDiceId, onDuplicateDice, onDiceFaceDoubleClick, canvasSettings }) => {
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');

  useEffect(() => {
    const handleViewMode = (e: CustomEvent) => setViewMode(e.detail);
    window.addEventListener('meevo-dice-view', handleViewMode as EventListener);
    return () => window.removeEventListener('meevo-dice-view', handleViewMode as EventListener);
  }, []);
  
  const dices = Object.values(boardDicesData);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd' && selectedDiceId) {
        e.preventDefault();
        onDuplicateDice(selectedDiceId);
      }
      if (e.shiftKey && (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1')) {
        e.preventDefault();
        setViewMode('2D');
      }
      if (e.shiftKey && (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2')) {
        e.preventDefault();
        setViewMode('3D');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDiceId, onDuplicateDice]);

  return (
    <div className="absolute inset-0 bg-meevo-surface-0 overflow-hidden flex flex-col">
      <div className="absolute top-6 left-6 ml-4 z-10 flex bg-meevo-surface-3 p-1 rounded-lg border border-meevo-border">
        <button
          onClick={(e) => { e.stopPropagation(); setViewMode('2D'); }}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === '2D' ? 'bg-meevo-purple text-white' : 'text-meevo-text-secondary hover:text-meevo-text-primary'}`}
        >
          2D
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setViewMode('3D'); }}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === '3D' ? 'bg-meevo-purple text-white' : 'text-meevo-text-secondary hover:text-meevo-text-primary'}`}
        >
          3D
        </button>
      </div>

      <div className="flex-1 w-full h-full">
        {viewMode === '2D' ? (
          <div className="w-full h-full overflow-auto p-20 flex flex-wrap gap-12 items-start justify-start content-start" onClick={() => setSelectedDiceId(null)}>
            {dices.map(dice => (
              <Dice2D 
                key={dice.id}
                dice={dice}
                selected={selectedDiceId === dice.id}
                onClick={() => setSelectedDiceId(dice.id)}
              />
            ))}
            {dices.length === 0 && (
              <div className="w-full h-full flex items-center justify-center text-meevo-text-tertiary">
                No dices created yet. Use the sidebar to create one.
              </div>
            )}
          </div>
        ) : (
          <Canvas camera={{ position: [0, 5, 10], fov: 50 }} onPointerMissed={() => setSelectedDiceId(null)}>
            <color attach="background" args={['#0E0E12']} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            <directionalLight position={[-10, -10, -5]} intensity={0.2} />
            
            <OrbitControls makeDefault />
            
            {/* Layout dices in 3D space in a grid */}
            {dices.map((dice, index) => {
              const columns = Math.ceil(Math.sqrt(dices.length));
              const x = (index % columns) * 8 - ((columns - 1) * 8) / 2;
              const z = Math.floor(index / columns) * 8 - ((Math.ceil(dices.length / columns) - 1) * 8) / 2;
              return (
                <group key={dice.id} position={[x, 0, z]}>
                  <Dice3D 
                    dice={dice}
                    selected={selectedDiceId === dice.id}
                    onClick={() => setSelectedDiceId(dice.id)}
                    onDoubleClick={(faceIndex) => onDiceFaceDoubleClick?.(dice.id, faceIndex)}
                  />
                  <DreiText position={[0, -3, 0]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
                    {dice.name}
                  </DreiText>
                </group>
              );
            })}
          </Canvas>
        )}
      </div>
    </div>
  );
};

