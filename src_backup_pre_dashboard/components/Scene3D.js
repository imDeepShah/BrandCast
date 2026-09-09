import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';

// The cinematic Film Reel representing Agentic Cinema (Background Watermark)
function FilmReel() {
  const meshRef = useRef();
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      const scrollY = window.scrollY; // Read scroll directly in the 60fps loop, avoiding expensive React state updates
      
      meshRef.current.rotation.y = time * 0.4;
      meshRef.current.rotation.z = time * 0.1;
      
      const scrollPercent = Math.min(scrollY / 3000, 1);
      
      const targetX = scrollPercent * 2;
      const targetY = scrollPercent * -1;
      const targetZ = scrollPercent * -5;
      
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.05);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.05);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 0.05);
      meshRef.current.rotation.x = scrollPercent * Math.PI * 2;

      const targetOpacity = Math.max(1 - (scrollPercent * 1.5), 0.02);
      meshRef.current.traverse((child) => {
        if (child.isMesh && child.material) {
           child.material.transparent = true;
           child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, targetOpacity, 0.05);
        }
      });
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group ref={meshRef}>
        <mesh position={[0, 0.5, 0]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[3, 3, 0.1, 32]} />
          <meshPhysicalMaterial color="#000000" metalness={0.9} roughness={0.1} transmission={0.9} ior={1.5} thickness={2} clearcoat={1} transparent opacity={1} />
        </mesh>
        <mesh position={[0, -0.5, 0]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[3, 3, 0.1, 32]} />
          <meshPhysicalMaterial color="#000000" metalness={0.9} roughness={0.1} transmission={0.9} ior={1.5} thickness={2} clearcoat={1} transparent opacity={1} />
        </mesh>
        <mesh rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 1.2, 32]} />
          <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} transparent opacity={1} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[2.5, 2.5, 0.8, 64, 1, true]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={1} wireframe transparent opacity={1} />
        </mesh>
      </group>
    </Float>
  );
}

// Litral 3D Cinematic Apparatus Avatars
function AgentAvatars({ activeAgent }) {
  const directorRef = useRef();
  const scoutRef = useRef();
  const producerRef = useRef();
  const execRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // The Director (Megaphone)
    if (directorRef.current) {
        directorRef.current.rotation.y = time * 0.5;
        directorRef.current.rotation.z = Math.sin(time) * 0.2;
        directorRef.current.scale.setScalar(THREE.MathUtils.lerp(directorRef.current.scale.x, activeAgent === 'The Director' ? 0.8 : 0, 0.1));
    }
    
    // The Scout (Binoculars)
    if (scoutRef.current) {
        scoutRef.current.rotation.y = Math.sin(time) * 0.5;
        scoutRef.current.rotation.z = Math.cos(time) * 0.2;
        scoutRef.current.scale.setScalar(THREE.MathUtils.lerp(scoutRef.current.scale.x, activeAgent === 'The Scout' ? 0.7 : 0, 0.1));
    }
    
    // The Producer (Briefcase)
    if (producerRef.current) {
        producerRef.current.rotation.y = time;
        producerRef.current.scale.setScalar(THREE.MathUtils.lerp(producerRef.current.scale.x, activeAgent === 'The Producer' ? 0.8 : 0, 0.1));
    }
    
    // The Exec (Fountain Pen)
    if (execRef.current) {
        execRef.current.rotation.z = -Math.PI / 4 + Math.sin(time * 2) * 0.1;
        execRef.current.rotation.y = time;
        execRef.current.scale.setScalar(THREE.MathUtils.lerp(execRef.current.scale.x, activeAgent === 'The Exec' ? 0.8 : 0, 0.1));
    }
  });

  return (
    <group position={[-3, 0, -4]}>
        {/* The Director: Megaphone */}
        <group ref={directorRef} scale={0}>
          <mesh rotation={[0, 0, Math.PI/2]}>
             <coneGeometry args={[1.5, 3, 32, 1, true]} />
             <meshStandardMaterial color="#111" metalness={0.9} roughness={0.7} />
          </mesh>
          <mesh position={[-1.5, 0, 0]} rotation={[0, 0, Math.PI/2]}>
             <cylinderGeometry args={[0.3, 0.3, 0.5, 32]} />
             <meshStandardMaterial color="#FFF" metalness={1} roughness={0.1} />
          </mesh>
          {/* Subtle neon glowing accent inside */}
          <mesh position={[1.4, 0, 0]} rotation={[0, 0, Math.PI/2]}>
             <cylinderGeometry args={[1.4, 1.4, 0.1, 32, 1, true]} />
             <meshStandardMaterial color="#FF0055" emissive="#FF0055" emissiveIntensity={2} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-0.5, -1, 0]} rotation={[0, 0, 0]}>
             <torusGeometry args={[0.5, 0.1, 16, 32, Math.PI]} />
             <meshPhysicalMaterial color="#333" metalness={0.5} roughness={0.2} clearcoat={1} transmission={0.9} />
          </mesh>
        </group>
        
        {/* The Scout: Binoculars */}
        <group ref={scoutRef} scale={0}>
           {/* Left Barrel */}
           <mesh position={[-0.8, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
             <cylinderGeometry args={[0.6, 0.8, 2, 32]} />
             <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.5} />
           </mesh>
           {/* Right Barrel */}
           <mesh position={[0.8, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
             <cylinderGeometry args={[0.6, 0.8, 2, 32]} />
             <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.5} />
           </mesh>
           {/* Center Bridge */}
           <mesh position={[0, 0, 0]}>
             <boxGeometry args={[1, 0.2, 0.5]} />
             <meshStandardMaterial color="#444" metalness={1} roughness={0.3} />
           </mesh>
           {/* Lenses */}
           <mesh position={[-0.8, 0, 1.01]} rotation={[Math.PI/2, 0, 0]}>
             <cylinderGeometry args={[0.55, 0.55, 0.05, 32]} />
             <meshPhysicalMaterial color="#000033" transmission={1} ior={1.5} clearcoat={1} roughness={0} emissive="#000033" emissiveIntensity={0.5} />
           </mesh>
           <mesh position={[0.8, 0, 1.01]} rotation={[Math.PI/2, 0, 0]}>
             <cylinderGeometry args={[0.55, 0.55, 0.05, 32]} />
             <meshPhysicalMaterial color="#000033" transmission={1} ior={1.5} clearcoat={1} roughness={0} emissive="#000033" emissiveIntensity={0.5} />
           </mesh>
        </group>

        {/* The Producer: Briefcase (Silver/Chrome) */}
        <group ref={producerRef} scale={0}>
           <mesh>
             <boxGeometry args={[3, 2, 0.5]} />
             <meshStandardMaterial color="#D0D0D0" metalness={1} roughness={0.1} />
           </mesh>
           <mesh position={[0, 1.2, 0]}>
             <torusGeometry args={[0.5, 0.1, 16, 32, Math.PI]} />
             <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
           </mesh>
           {/* Subtle golden latches */}
           <mesh position={[-0.8, 1, 0.26]}>
             <boxGeometry args={[0.2, 0.1, 0.05]} />
             <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.1} />
           </mesh>
           <mesh position={[0.8, 1, 0.26]}>
             <boxGeometry args={[0.2, 0.1, 0.05]} />
             <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.1} />
           </mesh>
        </group>

        {/* The Exec: Diamond / Gem */}
        <group ref={execRef} scale={0}>
           {/* Outer Glass Diamond */}
           <mesh>
             <octahedronGeometry args={[0.8, 0]} />
             <meshPhysicalMaterial 
               color="#FFF" 
               transmission={0.9} 
               transparent={true}
               opacity={1} 
               metalness={0.1} 
               roughness={0.05} 
               ior={1.5} 
               thickness={0.5} 
             />
           </mesh>
           {/* Inner Glowing Core */}
           <mesh scale={0.4}>
             <octahedronGeometry args={[0.8, 0]} />
             <meshStandardMaterial color="#00FF9D" emissive="#00FF9D" emissiveIntensity={2} wireframe={true} />
           </mesh>
           {/* Solid Core Center */}
           <mesh scale={0.2}>
             <octahedronGeometry args={[0.8, 0]} />
             <meshStandardMaterial color="#00FF9D" emissive="#00FF9D" emissiveIntensity={5} />
           </mesh>
        </group>
    </group>
  );
}

// Studio Lighting Rig
function Rig() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
      <directionalLight position={[-10, -10, -5]} intensity={1} color="#00F0FF" />
      <Environment preset="city" />
    </>
  );
}

export default function Scene3D({ activeAgent }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, background: '#030303' }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
        
        <Stars radius={100} depth={50} count={2000} factor={3} saturation={0} fade speed={1} />
        
        <FilmReel />
        <AgentAvatars activeAgent={activeAgent} />
        <Rig />
      </Canvas>
    </div>
  );
}
