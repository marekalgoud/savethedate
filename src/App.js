
import React, { Suspense, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { PresentationControls, Text3D, Plane, ContactShadows, SpotLight, useTexture, useDepthBuffer  } from '@react-three/drei'
import { Model } from './Model'

export default function Viewer() {
  const mouse = useRef([0, 0])
  const ref = useRef()
  const colors = ['#246E81', '#C4BF3F', '#9F315F', '#0F41A6']


  return (
    <Canvas shadows dpr={[1, 2]} camera={{ fov: 50 }}>
      <Suspense fallback={null}>
      <PresentationControls
        enabled={true} // the controls can be disabled by setting this to false
        global={false} // Spin globally or by dragging the model
        cursor={true} // Whether to toggle cursor style on drag
        snap={false} // Snap-back to center (can also be a spring config)
        speed={1} // Speed factor
        zoom={1} // Zoom factor when half the polar-max is reached
        rotation={[0, 0, 0]} // Default rotation
        polar={[Math.PI / 8, Math.PI / 4]} // Vertical limits
        azimuth={[-Math.PI / 4, Math.PI / 4]} // Horizontal limits
        config={{ mass: 1, tension: 170, friction: 26 }} // Spring config
      >
        <SpotLights />
        <ambientLight color="#FFFFFF" intensity={0.5} />
        {/* <Sparkles size={2} position={[0 ,1, 0]} color="#C4BF3F" count={10} /> */}
        <Model />
        <fog attach="fog" args={['white', 50, 190]} />
        <pointLight distance={100} intensity={4} color="white" />
        <ContactShadows opacity={1} scale={10} blur={1} far={10} resolution={256} color="#000000" />
          <MaterialPlane />
          <Text3D font={'/font.json'} bevelEnabled bevelSize={0.05} scale={0.4} position={[-2.5, 0, -1.5]}>
            18/11/2023
            <meshPhongMaterial color="#0F41A6" />
          </Text3D>
          <Text3D font={'/font.json'} bevelEnabled bevelSize={0.05} scale={0.2} position={[-1.2, 0, 1.5]}>
            Save the date
          <meshPhongMaterial color="#0F41A6" />
          </Text3D>
          <Swarm count={200} mouse={mouse} color={colors[0]} />
          <Swarm count={200} mouse={mouse} color={colors[1]} />
          <Swarm count={200} mouse={mouse} color={colors[2]} />
          <Swarm count={200} mouse={mouse} color={colors[3]} />
        </PresentationControls>
      </Suspense>
      
    </Canvas>
  )
}

function SpotLights() {
  const depthBuffer = useDepthBuffer({ size:  256 })

  return (
    <group>
        <SpotLight
          penumbra={0.5}
          depthBuffer={depthBuffer}
          position={[3, 5, 0]}
          intensity={0.4}
          angle={0.8}
          color="#ff005b"
          castShadow
        />
        <SpotLight
          penumbra={0.5}
          depthBuffer={depthBuffer}
          position={[-2, 5, 0]}
          intensity={0.4}
          angle={0.8}
          color="#0EEC82"
          castShadow
        />
        <SpotLight
          penumbra={0.5}
          depthBuffer={depthBuffer}
          position={[0, 5, -2]}
          intensity={0.4}
          angle={0.8}
          color="#0EEC82"
          castShadow
        />
    </group>
  )
}

function MaterialPlane() {
  const props = useTexture({
    map: `disco.jpeg`
  })

  console.log(props)
  return (
    <Plane args={[10, 10]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      {/* <meshPhongMaterial color="#C4BF3F" /> */}
      <meshStandardMaterial
        {...props}
      />
    </Plane>
  )
}

function Swarm({ count, mouse, color }) {
  const mesh = useRef()
  const light = useRef()
  const { size, viewport } = useThree()
  const aspect = size.width / viewport.width

  const dummy = useMemo(() => new THREE.Object3D(), [])
  // Generate some random positions, speed factors and timings
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100
      const factor = 20 + Math.random() * 100
      const speed = 0.01 + Math.random() / 200
      const xFactor = -50 + Math.random() * 100
      const yFactor = -50 + Math.random() * 100
      const zFactor = -50 + Math.random() * 100
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 })
    }
    return temp
  }, [count])
  // The innards of this hook will run every frame
  useFrame(state => {
    // Makes the light follow the mouse
    light.current.position.set(mouse.current[0] / aspect, -mouse.current[1] / aspect, 0)
    // Run through the randomized data to calculate some movement
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle
      // There is no sense or reason to any of this, just messing around with trigonometric functions
      t = particle.t += speed / 2
      const a = Math.cos(t) + Math.sin(t * 1) / 10
      const b = Math.sin(t) + Math.cos(t * 2) / 10
      const s = Math.cos(t)
      particle.mx += (mouse.current[0] - particle.mx) * 0.01
      particle.my += (mouse.current[1] * -1 - particle.my) * 0.01
      // Update the dummy object
      dummy.position.set(
        (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      )
      dummy.scale.set(s, s, s)
      dummy.rotation.set(s * 5, s * 5, s * 5)
      dummy.updateMatrix()
      // And apply the matrix to the instanced item
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return (
    <>
      <pointLight ref={light} distance={3} intensity={8} color="lightblue" />
      <instancedMesh ref={mesh} args={[null, null, count]} scale={1} position={[0, 0, -50]}>
        <dodecahedronBufferGeometry attach="geometry" args={[1, 0]} />
        <meshPhongMaterial attach="material" color={color} />
      </instancedMesh>
    </>
  )
}