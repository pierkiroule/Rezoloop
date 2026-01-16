import { useEffect, useRef } from "react";
import * as THREE from "three";

const VIDEO_LOOP_SECONDS = 20;
const SHADER_LOOP_SECONDS = 40;
const AUDIO_LOOP_SECONDS = 80;

const TEXT_CONTENT = `RÉSO•LOOPS — dispositif audiovisuel projectif.
Flux vidéo importé. Résonance audio locale. Déphasage temporel continu.
Surface lumineuse. Ondulation douce. Écart de phase prolongé.
Temps long, cycles imbriqués, perception ouverte, geste mobile.
Signal sans récit, espace sans injonction, présence sans narration.
Projection, oscillation, texture, rythme.`;

export default function App() {
  const containerRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const textureRef = useRef(null);
  const materialRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);
  const resizeHandlerRef = useRef(null);
  const videoUrlRef = useRef(null);
  const audioUrlRef = useRef(null);
  const videoTimeUpdateRef = useRef(null);
  const audioTimeUpdateRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      10
    );
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const fallbackTexture = new THREE.DataTexture(
      new Uint8Array([40, 20, 60, 255]),
      1,
      1,
      THREE.RGBAFormat
    );
    fallbackTexture.needsUpdate = true;
    textureRef.current = fallbackTexture;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uStrength: { value: 0.2 },
        uVideo: { value: textureRef.current },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uStrength;
        uniform sampler2D uVideo;
        varying vec2 vUv;

        float wave(vec2 uv, float time) {
          return sin((uv.y + time) * 6.2831) * 0.02 +
                 cos((uv.x + time * 0.5) * 6.2831) * 0.02;
        }

        void main() {
          vec2 uv = vUv;
          float distortion = wave(uv, uTime) * (0.5 + uStrength);
          uv.x += distortion;
          uv.y += distortion * 0.5;

          vec3 videoColor = texture2D(uVideo, uv).rgb;
          vec3 glow = vec3(0.08, 0.3, 0.25) + vec3(0.4, 0.2, 0.45) * uv.y;
          vec3 color = mix(glow, videoColor, 0.7);
          color += uStrength * 0.2;
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
    materialRef.current = material;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    resizeHandlerRef.current = handleResize;
    window.addEventListener("resize", handleResize);

    const frequencyData = new Uint8Array(64);
    const renderLoop = () => {
      const elapsedSeconds = performance.now() / 1000;
      const loopTime = elapsedSeconds % SHADER_LOOP_SECONDS;
      material.uniforms.uTime.value = loopTime / SHADER_LOOP_SECONDS;

      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(frequencyData);
        const average =
          frequencyData.reduce((sum, value) => sum + value, 0) /
          frequencyData.length /
          255;
        material.uniforms.uStrength.value = 0.15 + average * 0.85;
      } else {
        material.uniforms.uStrength.value = 0.25;
      }

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      geometry.dispose();
      material.dispose();
      if (textureRef.current) {
        textureRef.current.dispose();
      }
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleVideoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file || !materialRef.current) return;

    if (videoRef.current && videoTimeUpdateRef.current) {
      videoRef.current.removeEventListener(
        "timeupdate",
        videoTimeUpdateRef.current
      );
      videoRef.current.pause();
      videoRef.current.src = "";
    }
    if (videoUrlRef.current) {
      URL.revokeObjectURL(videoUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    videoUrlRef.current = url;

    const video = document.createElement("video");
    video.src = url;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    videoRef.current = video;

    if (textureRef.current && textureRef.current.isVideoTexture) {
      textureRef.current.dispose();
    }
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    textureRef.current = videoTexture;
    materialRef.current.uniforms.uVideo.value = videoTexture;

    const handleTimeUpdate = () => {
      if (video.currentTime >= VIDEO_LOOP_SECONDS) {
        video.currentTime = 0;
      }
    };
    videoTimeUpdateRef.current = handleTimeUpdate;
    video.addEventListener("timeupdate", handleTimeUpdate);

    video.play().catch(() => {});
  };

  const handleAudioChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (audioRef.current && audioTimeUpdateRef.current) {
      audioRef.current.removeEventListener(
        "timeupdate",
        audioTimeUpdateRef.current
      );
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    audioUrlRef.current = url;

    const audio = new Audio(url);
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;
    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect();
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    const source = audioContext.createMediaElementSource(audio);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;
    sourceRef.current = source;
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const handleTimeUpdate = () => {
      if (audio.currentTime >= AUDIO_LOOP_SECONDS) {
        audio.currentTime = 0;
      }
    };
    audioTimeUpdateRef.current = handleTimeUpdate;
    audio.addEventListener("timeupdate", handleTimeUpdate);

    audio.play().catch(() => {});
  };

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        if (videoTimeUpdateRef.current) {
          videoRef.current.removeEventListener(
            "timeupdate",
            videoTimeUpdateRef.current
          );
        }
        videoRef.current.pause();
        videoRef.current.src = "";
      }
      if (audioRef.current) {
        if (audioTimeUpdateRef.current) {
          audioRef.current.removeEventListener(
            "timeupdate",
            audioTimeUpdateRef.current
          );
        }
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  return (
    <div className="app">
      <div ref={containerRef} className="canvas" />
      <div className="overlay">
        <div className="controls">
          <label className="control">
            Importer vidéo
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4"
              onChange={handleVideoChange}
            />
          </label>
          <label className="control">
            Importer audio
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioChange}
            />
          </label>
        </div>
        <div className="scroll">
          <div className="scroll-inner">{TEXT_CONTENT}</div>
        </div>
      </div>
    </div>
  );
}
