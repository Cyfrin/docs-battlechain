'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export function BattlechainHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const mouseTargetRef = useRef({ x: 0.5, y: 0.5 })

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        mouseTargetRef.current = {
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height
        }
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Dithered logo shader
  const ditheredLogoShader = {
    uniforms: {
      logoTexture: { value: null },
      resolution: { value: new THREE.Vector2() },
      time: { value: 0 },
      mousePos: { value: new THREE.Vector2(0.5, 0.5) },
      isDark: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D logoTexture;
      uniform vec2 resolution;
      uniform float time;
      uniform vec2 mousePos;
      uniform float isDark;
      varying vec2 vUv;

      // 8x8 Bayer matrix for ordered dithering
      float bayerMatrix8(vec2 pos) {
        int x = int(mod(pos.x, 8.0));
        int y = int(mod(pos.y, 8.0));
        int index = x + y * 8;

        float matrix[64] = float[](
          0.0,  32.0,  8.0,  40.0,  2.0,  34.0, 10.0, 42.0,
          48.0, 16.0, 56.0, 24.0, 50.0, 18.0, 58.0, 26.0,
          12.0, 44.0,  4.0, 36.0, 14.0, 46.0,  6.0, 38.0,
          60.0, 28.0, 52.0, 20.0, 62.0, 30.0, 54.0, 22.0,
          3.0,  35.0, 11.0, 43.0,  1.0, 33.0,  9.0, 41.0,
          51.0, 19.0, 59.0, 27.0, 49.0, 17.0, 57.0, 25.0,
          15.0, 47.0,  7.0, 39.0, 13.0, 45.0,  5.0, 37.0,
          63.0, 31.0, 55.0, 23.0, 61.0, 29.0, 53.0, 21.0
        );

        return matrix[index] / 64.0;
      }

      void main() {
        vec2 uv = vUv;

        // Parallax offset from mouse (subtle)
        vec2 parallax = (mousePos - 0.5) * 0.03;
        vec2 logoUv = uv + parallax;

        // Center and scale the logo
        logoUv = (logoUv - 0.5) * 1.8 + 0.5;

        // Sample the logo texture
        vec4 logoSample = texture2D(logoTexture, logoUv);
        float logoMask = logoSample.a;

        // Create soft/fuzzy edges by sampling surrounding pixels
        float edgeBlur = 0.015;  // Adjust for more/less fuzziness
        float softMask = logoMask;
        softMask += texture2D(logoTexture, logoUv + vec2(edgeBlur, 0.0)).a;
        softMask += texture2D(logoTexture, logoUv - vec2(edgeBlur, 0.0)).a;
        softMask += texture2D(logoTexture, logoUv + vec2(0.0, edgeBlur)).a;
        softMask += texture2D(logoTexture, logoUv - vec2(0.0, edgeBlur)).a;
        softMask += texture2D(logoTexture, logoUv + vec2(edgeBlur, edgeBlur)).a;
        softMask += texture2D(logoTexture, logoUv - vec2(edgeBlur, edgeBlur)).a;
        softMask += texture2D(logoTexture, logoUv + vec2(edgeBlur, -edgeBlur)).a;
        softMask += texture2D(logoTexture, logoUv - vec2(edgeBlur, -edgeBlur)).a;
        softMask /= 9.0;  // Average of 9 samples creates blur

        // Apply ordered dithering with spacing control
        vec2 screenPos = uv * resolution;
        float ditherSize = 3.0;  // Spacing between potential dots
        vec2 ditherPos = screenPos / ditherSize;
        float threshold = bayerMatrix8(ditherPos);

        // Add subtle animation to threshold
        threshold += sin(time * 0.5) * 0.02;

        // Create dot pattern: only show dots where threshold is low (sparse pattern)
        // This creates a checkerboard-like pattern of dots
        float dotDensity = 0.4;  // Lower = fewer dots, higher = more dots
        float showDot = step(threshold, dotDensity);

        // Use soft mask for fuzzy edges - dots gradually fade at boundaries
        float dithered = softMask * showDot;

        // Distance from center for soft edges
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(uv, center);
        float softEdge = smoothstep(0.7, 0.3, dist);

        dithered *= softEdge;

        // Dark dots in light mode, white dots in dark mode
        vec3 lightModeColor = vec3(0.15, 0.18, 0.25);  // Dark blue-gray
        vec3 darkModeColor = vec3(1.0, 1.0, 1.0);      // White
        vec3 dotColor = mix(lightModeColor, darkModeColor, isDark);
        vec3 finalColor = dotColor * dithered;

        // Output dots with appropriate opacity
        gl_FragColor = vec4(finalColor, dithered * 0.8);
      }
    `
  }

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.z = 5
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Load logo texture
    const textureLoader = new THREE.TextureLoader()
    textureLoader.load(
      '/images/product-logos/battlechain.svg',
      (texture) => {
        // Create plane with dithered logo material
        const geometry = new THREE.PlaneGeometry(10, 10)
        const material = new THREE.ShaderMaterial({
          uniforms: {
            ...ditheredLogoShader.uniforms,
            logoTexture: { value: texture }
          },
          vertexShader: ditheredLogoShader.vertexShader,
          fragmentShader: ditheredLogoShader.fragmentShader,
          transparent: true,
          depthWrite: false
        })

        const plane = new THREE.Mesh(geometry, material)
        scene.add(plane)

        // Set resolution
        material.uniforms.resolution.value.set(width, height)

        // Dark mode detection
        const updateDarkMode = () => {
          const isDark = document.documentElement.classList.contains('dark')
          material.uniforms.isDark.value = isDark ? 1 : 0
        }
        updateDarkMode()

        const observer = new MutationObserver(updateDarkMode)
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class']
        })

        // Animation loop
        let animationId: number
        const clock = new THREE.Clock()
        let mousePos = { x: 0.5, y: 0.5 }

        const animate = () => {
          animationId = requestAnimationFrame(animate)

          // Smooth mouse following
          mousePos.x += (mouseTargetRef.current.x - mousePos.x) * 0.05
          mousePos.y += (mouseTargetRef.current.y - mousePos.y) * 0.05

          // Update uniforms
          material.uniforms.time.value = clock.getElapsedTime()
          material.uniforms.mousePos.value.set(mousePos.x, 1.0 - mousePos.y)

          // Slight camera movement
          camera.position.x = (mousePos.x - 0.5) * 0.3
          camera.position.y = (mousePos.y - 0.5) * -0.3
          camera.lookAt(scene.position)

          renderer.render(scene, camera)
        }

        animate()

        // Handle resize
        const handleResize = () => {
          const width = container.clientWidth
          const height = container.clientHeight

          camera.aspect = width / height
          camera.updateProjectionMatrix()

          renderer.setSize(width, height)
          material.uniforms.resolution.value.set(width, height)
        }

        window.addEventListener('resize', handleResize)

        // Cleanup
        const cleanup = () => {
          window.removeEventListener('resize', handleResize)
          cancelAnimationFrame(animationId)
          observer.disconnect()
          renderer.dispose()
          geometry.dispose()
          material.dispose()
          texture.dispose()
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement)
          }
        }

        // Store cleanup function
        container.setAttribute('data-cleanup', 'true')
        ;(container as any).__cleanup = cleanup
      },
      undefined,
      (error) => {
        console.error('Error loading logo texture:', error)
      }
    )

    // Return cleanup that will be called when component unmounts
    return () => {
      if ((container as any).__cleanup) {
        ;(container as any).__cleanup()
      }
    }
  }, [])

  return (
    <div className="relative w-full h-[65vh] min-h-[500px] max-h-[700px]">
      {/* Contained spotlight gradient - fully within bounds */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 45% 55% at 50% 45%, rgba(37, 99, 235, 0.95) 0%, rgba(29, 78, 216, 0.75) 25%, rgba(30, 64, 175, 0.55) 45%, rgba(59, 130, 246, 0.35) 65%, rgba(30, 64, 175, 0.15) 85%, transparent 100%)',
          filter: 'blur(12px)'
        }}
      />
      <div
        className="absolute inset-0 dark:block hidden"
        style={{
          background: 'radial-gradient(ellipse 45% 55% at 50% 45%, rgba(30, 58, 138, 0.9) 0%, rgba(17, 24, 39, 0.7) 30%, rgba(30, 58, 138, 0.5) 50%, rgba(15, 23, 42, 0.3) 70%, rgba(17, 24, 39, 0.12) 90%, transparent 100%)',
          filter: 'blur(12px)'
        }}
      />

      {/* Three.js canvas container */}
      <div ref={containerRef} className="absolute inset-0 overflow-hidden" />

      {/* Centered text overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 pointer-events-none">
        {/* Title */}
        <h1
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white mb-6"
          style={{
            color: 'white',
            WebkitTextFillColor: 'white',
            background: 'none',
            backgroundClip: 'unset',
            WebkitBackgroundClip: 'unset',
            textShadow: '0 0 30px rgba(0,0,0,0.9), 0 4px 30px rgba(0,0,0,0.7), 0 2px 15px rgba(0,0,0,0.6)'
          }}
        >
          BattleChain
        </h1>

        {/* Tagline */}
        <p
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-bold mb-4"
          style={{
            textShadow: '0 0 30px rgba(0,0,0,0.9), 0 4px 30px rgba(0,0,0,0.7), 0 2px 15px rgba(0,0,0,0.6)'
          }}
        >
          Go Attackable
        </p>

        {/* Subtitle */}
        <p
          className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-3xl mt-2"
          style={{
            textShadow: '0 0 30px rgba(0,0,0,0.9), 0 4px 30px rgba(0,0,0,0.7), 0 2px 15px rgba(0,0,0,0.6)'
          }}
        >
          Trial by fire for smart contracts in the most antagonistic environment
        </p>
      </div>

      {/* Subtle bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none z-20 opacity-40" />
    </div>
  )
}
