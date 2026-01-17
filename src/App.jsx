import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceCollide,
} from "d3-force";
import * as THREE from "three";

const EMOJI_LIBRARY = ["🌊", "🌫️", "🔥", "⚡", "🌱", "🪨", "🪐", "🧭", "🪞", "🧵", "🌙", "✨"];

const TAG_POOL = [
  "onde",
  "sillage",
  "brume",
  "halo",
  "élan",
  "frisson",
  "pollen",
  "gravité",
  "tension",
  "reflet",
  "trame",
  "silence",
  "étincelle",
  "écho",
];

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

const createNode = (emoji) => ({ id: createId(), emoji });

const createLink = (sourceId, targetId, strength = 0.6) => ({
  id: createId(),
  source: sourceId,
  target: targetId,
  strength: clamp(strength, 0.2, 1),
});

const getLinkNodeId = (value) =>
  typeof value === "object" && value !== null ? value.id : value;

const computeResoParams = (nodes, links) => {
  if (!nodes.length) {
    return {
      density: 0,
      tension: 0,
      spread: 0,
      rhythm: 0,
      heterogeneity: 0,
    };
  }

  const positions = nodes
    .map((node) => ({ x: node.x ?? 0, y: node.y ?? 0 }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

  const center = positions.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 }
  );
  const count = Math.max(positions.length, 1);
  center.x /= count;
  center.y /= count;

  const spread = positions.length
    ? Math.sqrt(
        positions.reduce((sum, point) => {
          const dx = point.x - center.x;
          const dy = point.y - center.y;
          return sum + dx * dx + dy * dy;
        }, 0) / positions.length
      )
    : 0;

  const linkDistances = links
    .map((link) => {
      const sourceId = getLinkNodeId(link.source);
      const targetId = getLinkNodeId(link.target);
      const source = nodes.find((node) => node.id === sourceId);
      const target = nodes.find((node) => node.id === targetId);
      if (!source || !target) return null;
      if (!Number.isFinite(source.x) || !Number.isFinite(target.x)) return null;
      const dx = source.x - target.x;
      const dy = source.y - target.y;
      return Math.hypot(dx, dy);
    })
    .filter((value) => value !== null);

  const averageLinkDistance = linkDistances.length
    ? linkDistances.reduce((sum, value) => sum + value, 0) / linkDistances.length
    : 0;

  const nodeCount = nodes.length;
  const linkCount = links.length;
  const maxLinks = nodeCount > 1 ? (nodeCount * (nodeCount - 1)) / 2 : 1;
  const density = clamp(linkCount / maxLinks);

  const tension = clamp((averageLinkDistance || 0) / 160);
  const rhythm = clamp((linkCount + nodeCount) / 20);
  const heterogeneity = clamp(
    nodes.reduce((sum, node) => sum + (node.emoji.codePointAt(0) ?? 0), 0) /
      (nodes.length * 50000)
  );

  return {
    density,
    tension,
    spread: clamp(spread / 220),
    rhythm,
    heterogeneity,
  };
};

function AudioEngine({ mode, audioRef }) {
  useEffect(() => {
    if (mode !== "PLAY") return undefined;
    if (audioRef.current) return undefined;
    if (!navigator?.mediaDevices?.getUserMedia) return undefined;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    let stream = null;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((mediaStream) => {
        stream = mediaStream;
        const source = audioContext.createMediaStreamSource(mediaStream);
        source.connect(analyser);
        audioRef.current = { analyser, dataArray, audioContext, source, stream };
      })
      .catch(() => {
        audioRef.current = { analyser, dataArray, audioContext, stream: null };
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      audioContext.close();
      audioRef.current = null;
    };
  }, [audioRef, mode]);

  return null;
}

function GraphLayer({
  mode,
  graphRef,
  graphVersion,
  onResoParams,
  onLink,
  onRemoveNode,
}) {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const linkForceRef = useRef(null);
  const elementsRef = useRef({ nodes: new Map(), links: new Map() });
  const groupsRef = useRef({ linkGroup: null, nodeGroup: null });
  const draggingRef = useRef(null);
  const selectedRef = useRef(null);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const lastResoRef = useRef(0);
  const modeRef = useRef(mode);

  const updateElements = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const { nodes, links } = graphRef.current;
    const elements = elementsRef.current;
    const { linkGroup, nodeGroup } = groupsRef.current;

    links.forEach((link) => {
      if (elements.links.has(link.id)) return;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "graph-link");
      linkGroup?.appendChild(line);
      elements.links.set(link.id, line);
    });

    elements.links.forEach((line, id) => {
      if (!links.find((link) => link.id === id)) {
        line.remove();
        elements.links.delete(id);
      }
    });

    nodes.forEach((node) => {
      if (elements.nodes.has(node.id)) return;
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("class", "graph-node");
      text.textContent = node.emoji;
      text.dataset.id = node.id;
      text.addEventListener("pointerdown", (event) => {
        if (modeRef.current === "PLAY") return;
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        draggingRef.current = {
          id: node.id,
          startX: event.clientX,
          startY: event.clientY,
          moved: false,
        };
        node.fx = node.x;
        node.fy = node.y;
      });
      text.addEventListener("pointermove", (event) => {
        if (!draggingRef.current || draggingRef.current.id !== node.id) return;
        const { width, height, left, top } = svg.getBoundingClientRect();
        const x = event.clientX - left;
        const y = event.clientY - top;
        draggingRef.current.moved = true;
        node.fx = clamp(x, 20, width - 20);
        node.fy = clamp(y, 20, height - 20);
        if (simulationRef.current) {
          simulationRef.current.alpha(0.3).restart();
        }
      });
      text.addEventListener("pointerup", () => {
        if (!draggingRef.current || draggingRef.current.id !== node.id) return;
        const moved = draggingRef.current.moved;
        draggingRef.current = null;
        node.fx = null;
        node.fy = null;
        if (!moved) {
          if (selectedRef.current && selectedRef.current !== node.id) {
            onLink(selectedRef.current, node.id);
            const previous = selectedRef.current;
            selectedRef.current = null;
            elementsRef.current.nodes.get(previous)?.classList.remove("is-selected");
          } else {
            selectedRef.current = node.id;
            elementsRef.current.nodes.forEach((el) => el.classList.remove("is-selected"));
            elementsRef.current.nodes.get(node.id)?.classList.add("is-selected");
          }
        }
      });
      text.addEventListener("dblclick", () => {
        if (modeRef.current === "PLAY") return;
        onRemoveNode(node.id);
      });
      nodeGroup?.appendChild(text);
      elements.nodes.set(node.id, text);
    });

    elements.nodes.forEach((text, id) => {
      if (!nodes.find((node) => node.id === id)) {
        text.remove();
        elements.nodes.delete(id);
        if (selectedRef.current === id) {
          selectedRef.current = null;
        }
      }
    });
  }, [graphRef, mode, onLink, onRemoveNode]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const { width, height } = svg.getBoundingClientRect();
    dimensionsRef.current = { width, height };

    const linkGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    linkGroup.setAttribute("class", "graph-links");
    nodeGroup.setAttribute("class", "graph-nodes");
    svg.appendChild(linkGroup);
    svg.appendChild(nodeGroup);
    groupsRef.current = { linkGroup, nodeGroup };

    const simulation = forceSimulation(graphRef.current.nodes)
      .force(
        "link",
        forceLink(graphRef.current.links)
          .id((d) => d.id)
          .distance(80)
          .strength((d) => d.strength)
      )
      .force("charge", forceManyBody().strength(-60))
      .force("collide", forceCollide(22).strength(0.9).iterations(2))
      .force("center", forceCenter(width / 2, height / 2));

    linkForceRef.current = simulation.force("link");
    simulationRef.current = simulation;

    simulation.on("tick", () => {
      const { nodes, links } = graphRef.current;
      elementsRef.current.nodes.forEach((text, id) => {
        const node = nodes.find((item) => item.id === id);
        if (!node) return;
        text.setAttribute("x", node.x ?? 0);
        text.setAttribute("y", node.y ?? 0);
      });

      elementsRef.current.links.forEach((line, id) => {
        const link = links.find((item) => item.id === id);
        if (!link) return;
        const source = link.source;
        const target = link.target;
        const sourceNode =
          typeof source === "object"
            ? source
            : nodes.find((item) => item.id === source);
        const targetNode =
          typeof target === "object"
            ? target
            : nodes.find((item) => item.id === target);
        if (!sourceNode || !targetNode) return;
        line.setAttribute("x1", sourceNode.x ?? 0);
        line.setAttribute("y1", sourceNode.y ?? 0);
        line.setAttribute("x2", targetNode.x ?? 0);
        line.setAttribute("y2", targetNode.y ?? 0);
      });

      const now = performance.now();
      if (now - lastResoRef.current > 120) {
        lastResoRef.current = now;
        const params = computeResoParams(nodes, links);
        onResoParams(params);
      }
    });

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: nextWidth, height: nextHeight } = entry.contentRect;
        if (!nextWidth || !nextHeight) return;
        dimensionsRef.current = { width: nextWidth, height: nextHeight };
        simulation.force("center", forceCenter(nextWidth / 2, nextHeight / 2));
        simulation.alpha(0.3).restart();
      }
    });

    resizeObserver.observe(svg);

    return () => {
      resizeObserver.disconnect();
      simulation.stop();
    };
  }, [graphRef, onResoParams]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    updateElements();
    const simulation = simulationRef.current;
    if (!simulation) return;
    simulation.nodes(graphRef.current.nodes);
    linkForceRef.current?.links(graphRef.current.links);

    if (mode === "PLAY") {
      simulation.alpha(0.6).restart();
    } else {
      simulation.alpha(0.2).restart();
      simulation.tick(30);
    }
  }, [graphRef, graphVersion, mode, updateElements]);

  return <svg ref={svgRef} className="graph-layer" />;
}

function ThreeLayer({ resoParamsRef, audioRef, mode, onAudioPeak }) {
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const lastPeakRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 0.2 },
      uSpread: { value: 0.2 },
      uNoise: { value: 0.2 },
      uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        uniform float uSpread;
        uniform float uNoise;
        uniform vec2 uResolution;

        float rand(vec2 co) {
          return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
        }

        void main() {
          vec2 uv = gl_FragCoord.xy / uResolution;
          float wave = sin((uv.x + uTime * 0.05) * 6.0) * 0.5 + 0.5;
          float swirl = sin((uv.y + uTime * 0.03) * 5.0) * 0.5 + 0.5;
          float noise = rand(uv + uTime) * 0.4;
          float intensity = mix(wave, swirl, uSpread) + noise * uNoise;
          vec3 color = vec3(0.08, 0.1, 0.15) + intensity * uIntensity * vec3(0.4, 0.3, 0.6);
          gl_FragColor = vec4(color, 0.85);
        }
      `,
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      uniforms.uResolution.value.set(width, height);
    };
    window.addEventListener("resize", handleResize);

    let lastTime = performance.now();

    const animate = (time) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      const reso = resoParamsRef.current ?? {
        tension: 0.2,
        spread: 0.2,
      };

      let audioLevel = 0.15;
      const audioState = audioRef.current;
      if (audioState?.analyser) {
        audioState.analyser.getByteFrequencyData(audioState.dataArray);
        const average =
          audioState.dataArray.reduce((sum, value) => sum + value, 0) /
          audioState.dataArray.length;
        audioLevel = clamp(average / 200, 0.05, 1);
      }

      const intensityTarget = clamp(reso.tension + audioLevel * 0.4, 0.1, 1);
      const spreadTarget = clamp(reso.spread + audioLevel * 0.3, 0.05, 1);

      uniforms.uTime.value += delta * (mode === "PLAY" ? 1.2 : 0.4);
      uniforms.uIntensity.value += (intensityTarget - uniforms.uIntensity.value) * 0.05;
      uniforms.uSpread.value += (spreadTarget - uniforms.uSpread.value) * 0.05;
      uniforms.uNoise.value += (audioLevel - uniforms.uNoise.value) * 0.08;

      if (audioLevel > 0.75 && time - lastPeakRef.current > 1200) {
        lastPeakRef.current = time;
        onAudioPeak();
      }

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [audioRef, mode, onAudioPeak, resoParamsRef]);

  return <div ref={containerRef} className="three-layer" />;
}

export default function App() {
  const [mode, setMode] = useState("STOP");
  const [graphVersion, setGraphVersion] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tags, setTags] = useState([]);
  const [selectedEmojis, setSelectedEmojis] = useState([]);

  const graphRef = useRef({ nodes: [], links: [] });
  const resoParamsRef = useRef({
    density: 0,
    tension: 0.2,
    spread: 0.2,
    rhythm: 0,
    heterogeneity: 0,
  });
  const audioRef = useRef(null);
  const lastResoParamsRef = useRef(resoParamsRef.current);
  const lastTagRef = useRef(0);

  useEffect(() => {
    if (graphRef.current.nodes.length === 0) {
      graphRef.current.nodes.push(createNode(EMOJI_LIBRARY[0]));
      setGraphVersion((prev) => prev + 1);
    }
  }, []);

  useEffect(() => {
    if (pickerOpen) {
      setSelectedEmojis([]);
    }
  }, [pickerOpen]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      setTags((prev) => prev.filter((tag) => now - tag.createdAt < tag.ttl));
    }, 400);
    return () => window.clearInterval(interval);
  }, []);

  const pickTagText = useCallback(() => {
    const nodes = graphRef.current.nodes;
    if (!nodes.length) return "";
    const index = nodes[Math.floor(Math.random() * nodes.length)].emoji.codePointAt(0) ?? 0;
    const word = TAG_POOL[index % TAG_POOL.length];
    const second = TAG_POOL[(index + nodes.length) % TAG_POOL.length];
    return word === second ? word : `${word} · ${second}`;
  }, []);

  const spawnTag = useCallback((reason = "") => {
    const now = Date.now();
    if (now - lastTagRef.current < 700 && reason !== "add") return;
    lastTagRef.current = now;
    const text = pickTagText();
    if (!text) return;
    const ttl = 2200 + Math.random() * 1600;
    setTags((prev) => [
      ...prev,
      {
        id: createId(),
        text,
        x: 10 + Math.random() * 80,
        y: 15 + Math.random() * 70,
        createdAt: now,
        ttl,
      },
    ]);
  }, [pickTagText]);

  const addSelectedEmojis = () => {
    if (selectedEmojis.length === 0) return;
    selectedEmojis.forEach((emoji) => {
      graphRef.current.nodes.push(createNode(emoji));
    });
    setGraphVersion((prev) => prev + 1);
    setPickerOpen(false);
    setSelectedEmojis([]);
    spawnTag("add");
  };

  const toggleEmojiSelection = (emoji) => {
    setSelectedEmojis((prev) =>
      prev.includes(emoji) ? prev.filter((item) => item !== emoji) : [...prev, emoji]
    );
  };

  const addLink = (sourceId, targetId) => {
    if (sourceId === targetId) return;
    const existingIndex = graphRef.current.links.findIndex(
      (link) =>
        (getLinkNodeId(link.source) === sourceId &&
          getLinkNodeId(link.target) === targetId) ||
        (getLinkNodeId(link.source) === targetId &&
          getLinkNodeId(link.target) === sourceId)
    );
    if (existingIndex !== -1) {
      graphRef.current.links.splice(existingIndex, 1);
      setGraphVersion((prev) => prev + 1);
      spawnTag("unlink");
      return;
    }
    graphRef.current.links.push(createLink(sourceId, targetId, 0.6));
    setGraphVersion((prev) => prev + 1);
    spawnTag("link");
  };

  const removeNode = (nodeId) => {
    graphRef.current.nodes = graphRef.current.nodes.filter((node) => node.id !== nodeId);
    graphRef.current.links = graphRef.current.links.filter(
      (link) => getLinkNodeId(link.source) !== nodeId && getLinkNodeId(link.target) !== nodeId
    );
    setGraphVersion((prev) => prev + 1);
  };

  const handleResoParams = useCallback(
    (params) => {
      resoParamsRef.current = params;
      const previous = lastResoParamsRef.current;
      const delta = Math.abs(params.tension - previous.tension) +
        Math.abs(params.spread - previous.spread);
      if (delta > 0.18) {
        spawnTag("shift");
      }
      lastResoParamsRef.current = params;
    },
    [spawnTag]
  );

  const toggleMode = () => {
    setMode((prev) => (prev === "PLAY" ? "STOP" : "PLAY"));
  };

  const emojiOptions = useMemo(() => EMOJI_LIBRARY, []);

  return (
    <div className={`app mode-${mode.toLowerCase()}`}>
      <ThreeLayer
        resoParamsRef={resoParamsRef}
        audioRef={audioRef}
        mode={mode}
        onAudioPeak={() => spawnTag("audio")}
      />
      <GraphLayer
        mode={mode}
        graphRef={graphRef}
        graphVersion={graphVersion}
        onResoParams={handleResoParams}
        onLink={addLink}
        onRemoveNode={removeNode}
      />
      <AudioEngine mode={mode} audioRef={audioRef} />
      <button
        type="button"
        className="mode-toggle"
        onClick={toggleMode}
        aria-label={mode === "PLAY" ? "Reprendre la main" : "Faire résonner"}
      >
        {mode === "PLAY" ? "■" : "▶"}
      </button>
      <div className="controls">
        <button
          type="button"
          className="control ghost"
          onClick={() => setPickerOpen(true)}
          aria-label="Ajouter un emoji"
        >
          +
        </button>
      </div>
      {pickerOpen ? (
        <div className="picker">
          <div className="picker-grid">
            {emojiOptions.map((emoji) => (
              <button
                type="button"
                key={emoji}
                onClick={() => toggleEmojiSelection(emoji)}
                className={selectedEmojis.includes(emoji) ? "is-selected" : ""}
                aria-pressed={selectedEmojis.includes(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="picker-actions">
            <span className="picker-count">
              {selectedEmojis.length
                ? `${selectedEmojis.length} sélectionné${selectedEmojis.length > 1 ? "s" : ""}`
                : "Sélectionnez un ou plusieurs"}
            </span>
            <button
              type="button"
              className="picker-submit"
              onClick={addSelectedEmojis}
              disabled={selectedEmojis.length === 0}
            >
              Déposer
            </button>
          </div>
          <button type="button" className="picker-close" onClick={() => setPickerOpen(false)}>
            Annuler
          </button>
        </div>
      ) : null}
      <div className="tags-layer" aria-hidden="true">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="tag"
            style={{
              left: `${tag.x}%`,
              top: `${tag.y}%`,
              animationDuration: `${tag.ttl}ms`,
            }}
          >
            {tag.text}
          </span>
        ))}
      </div>
    </div>
  );
}
