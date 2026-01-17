import { useEffect, useMemo, useRef, useState } from "react";
import {
  EMOJI_LIBRARY,
  createGraphLink,
  createGraphNode,
} from "./graphModel";

const PROMPT = "Dépose ce qui est là, en emojis.";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getRelativePosition = (event, rect) => {
  const x = clamp((event.clientX - rect.left) / rect.width, 0.05, 0.95);
  const y = clamp((event.clientY - rect.top) / rect.height, 0.05, 0.95);
  return { x, y };
};

const TAG_POOL = {
  fluid: ["onde", "sillage", "remous", "dérive", "écume"],
  mist: ["brume", "halo", "voile", "brouillard", "lueur"],
  kinetic: ["impact", "pulse", "élan", "frisson", "choc"],
  pulse: ["rythme", "battement", "clignement", "surge", "éclair"],
  organic: ["sève", "pollen", "croissance", "respire", "racine"],
  mineral: ["grain", "minéral", "strates", "lave", "poussière"],
  orbit: ["orbite", "gravité", "cycle", "halo", "constellation"],
  vector: ["flux", "tension", "trajectoire", "axe", "dérive"],
  reflective: ["reflet", "miroir", "retour", "prisme", "écho"],
  thread: ["fil", "trame", "liaison", "tissage", "nœud"],
  nocturne: ["nocturne", "velours", "ombre", "veille", "silence"],
  spark: ["étincelle", "scintillement", "jaillissement", "lueur", "spark"],
};

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const pickTagText = (nodes, links) => {
  if (!nodes.length) return "";
  const weightedTypes = nodes.map((node) => node.type);
  const type = weightedTypes[Math.floor(Math.random() * weightedTypes.length)];
  const words = TAG_POOL[type] ?? TAG_POOL.fluid;
  const base = words[Math.floor(Math.random() * words.length)];
  if (!links.length || Math.random() < 0.6) return base;
  const otherType =
    weightedTypes[Math.floor(Math.random() * weightedTypes.length)] ?? type;
  const otherWords = TAG_POOL[otherType] ?? TAG_POOL.fluid;
  const other = otherWords[Math.floor(Math.random() * otherWords.length)];
  if (other === base) return base;
  return `${base} · ${other}`;
};

export default function App() {
  const graphRef = useRef(null);
  const longPressRef = useRef(null);
  const dragRef = useRef(null);
  const deletePressRef = useRef(null);
  const animationRef = useRef(null);
  const nodesRef = useRef([]);
  const audioRef = useRef(null);
  const energyRef = useRef(0);
  const lastTagRef = useRef(0);

  const [mode, setMode] = useState("STOP");
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [picker, setPicker] = useState({ open: false, x: 0.5, y: 0.5 });
  const [tags, setTags] = useState([]);
  const [energy, setEnergy] = useState(0);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const linkPaths = useMemo(() => {
    const nodeMap = nodes.reduce((acc, node) => {
      acc[node.id] = node;
      return acc;
    }, {});

    return links
      .map((link) => {
        const source = nodeMap[link.sourceId];
        const target = nodeMap[link.targetId];
        if (!source || !target) return null;
        return { link, source, target };
      })
      .filter(Boolean);
  }, [links, nodes]);

  const openPickerAtEvent = (event) => {
    const rect = graphRef.current?.getBoundingClientRect();
    if (!rect) return;
    const position = getRelativePosition(event, rect);
    setPicker({ open: true, ...position });
  };

  const spawnTag = ({ x, y, reason = "" }) => {
    const now = Date.now();
    if (now - lastTagRef.current < 700 && reason !== "add") return;
    lastTagRef.current = now;
    const text = pickTagText(nodesRef.current, links);
    if (!text) return;
    const ttl = 2400 + Math.random() * 1600;
    setTags((prev) => [
      ...prev,
      {
        id: createId(),
        text,
        x,
        y,
        createdAt: now,
        ttl,
      },
    ]);
  };

  const addEmoji = (symbol) => {
    const node = {
      ...createGraphNode({ symbol, position: { x: picker.x, y: picker.y } }),
      vx: (Math.random() - 0.5) * 0.02,
      vy: (Math.random() - 0.5) * 0.02,
    };
    setNodes((prev) => [...prev, node]);
    setPicker((prev) => ({ ...prev, open: false }));
    if (mode === "PLAY") {
      spawnTag({ x: node.x, y: node.y, reason: "add" });
    }
  };

  const handleCanvasPointerDown = (event) => {
    if (event.target !== graphRef.current) return;
    if (longPressRef.current) {
      window.clearTimeout(longPressRef.current);
    }
    longPressRef.current = window.setTimeout(() => {
      openPickerAtEvent(event);
      longPressRef.current = null;
    }, 450);
  };

  const handleCanvasPointerUp = () => {
    if (longPressRef.current) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const handleNodePointerDown = (event, nodeId) => {
    event.stopPropagation();
    if (mode === "PLAY") return;
    const rect = graphRef.current?.getBoundingClientRect();
    if (!rect) return;
    const position = getRelativePosition(event, rect);
    const node = nodes.find((item) => item.id === nodeId);
    if (!node) return;

    dragRef.current = {
      nodeId,
      offsetX: position.x - node.x,
      offsetY: position.y - node.y,
    };
    deletePressRef.current = window.setTimeout(() => {
      setNodes((prev) => prev.filter((item) => item.id !== nodeId));
      setLinks((prev) =>
        prev.filter(
          (link) => link.sourceId !== nodeId && link.targetId !== nodeId
        )
      );
      dragRef.current = null;
      deletePressRef.current = null;
    }, 520);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleNodePointerMove = (event) => {
    if (mode === "PLAY") return;
    if (!dragRef.current) return;
    if (deletePressRef.current) {
      window.clearTimeout(deletePressRef.current);
      deletePressRef.current = null;
    }
    const rect = graphRef.current?.getBoundingClientRect();
    if (!rect) return;
    const position = getRelativePosition(event, rect);
    const nextX = clamp(position.x - dragRef.current.offsetX, 0.05, 0.95);
    const nextY = clamp(position.y - dragRef.current.offsetY, 0.05, 0.95);
    setNodes((prev) =>
      prev.map((node) =>
        node.id === dragRef.current.nodeId ? { ...node, x: nextX, y: nextY } : node
      )
    );
  };

  const handleNodePointerUp = (event) => {
    if (mode === "PLAY") return;
    if (deletePressRef.current) {
      window.clearTimeout(deletePressRef.current);
      deletePressRef.current = null;
    }
    if (!dragRef.current) return;
    const rect = graphRef.current?.getBoundingClientRect();
    if (!rect) return;

    const activeId = dragRef.current.nodeId;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);

    const pointer = getRelativePosition(event, rect);
    const pointerPx = {
      x: pointer.x * rect.width,
      y: pointer.y * rect.height,
    };

    const closest = nodes
      .filter((node) => node.id !== activeId)
      .map((node) => {
        const dx = node.x * rect.width - pointerPx.x;
        const dy = node.y * rect.height - pointerPx.y;
        return { node, distance: Math.hypot(dx, dy) };
      })
      .sort((a, b) => a.distance - b.distance)[0];

    if (closest && closest.distance < 80) {
      const exists = links.some(
        (link) =>
          (link.sourceId === activeId && link.targetId === closest.node.id) ||
          (link.sourceId === closest.node.id && link.targetId === activeId)
      );
      if (!exists) {
        const weight = clamp(1 - closest.distance / 120, 0.2, 1);
        setLinks((prev) => [
          ...prev,
          createGraphLink({
            sourceId: activeId,
            targetId: closest.node.id,
            weight,
          }),
        ]);
        if (mode === "PLAY") {
          spawnTag({ x: closest.node.x, y: closest.node.y, reason: "link" });
        }
      }
    }
  };

  const closePicker = () => setPicker((prev) => ({ ...prev, open: false }));

  const toggleMode = () => {
    setMode((prev) => (prev === "PLAY" ? "STOP" : "PLAY"));
  };

  const ensureAudio = async () => {
    if (audioRef.current) return;
    if (!navigator?.mediaDevices?.getUserMedia) return;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      audioRef.current = { audioContext, analyser, dataArray, stream, source };
    } catch (error) {
      audioRef.current = { audioContext, analyser, dataArray };
    }
  };

  useEffect(() => {
    if (mode === "PLAY") {
      ensureAudio();
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "PLAY") {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setNodes((prev) =>
        prev.map((node) => ({ ...node, vx: 0, vy: 0 }))
      );
      return undefined;
    }

    let lastTime = performance.now();

    const animate = (time) => {
      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      let audioEnergy = 0.35 + Math.sin(time / 850) * 0.15;
      const audioState = audioRef.current;
      if (audioState?.analyser) {
        audioState.analyser.getByteFrequencyData(audioState.dataArray);
        const average =
          audioState.dataArray.reduce((sum, value) => sum + value, 0) /
          audioState.dataArray.length;
        audioEnergy = clamp(average / 160, 0.2, 1);
      }
      energyRef.current = audioEnergy;
      setEnergy(audioEnergy);

      setNodes((prev) => {
        const next = prev.map((node) => ({ ...node }));
        for (let i = 0; i < next.length; i += 1) {
          const node = next[i];
          let fx = 0;
          let fy = 0;
          for (let j = 0; j < next.length; j += 1) {
            if (i === j) continue;
            const other = next[j];
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.hypot(dx, dy) + 0.001;
            const repel = 0.006 / (dist * dist);
            fx += (dx / dist) * repel;
            fy += (dy / dist) * repel;
            if (dist < 0.08 && Math.random() < 0.003) {
              spawnTag({
                x: clamp((node.x + other.x) / 2, 0.08, 0.92),
                y: clamp((node.y + other.y) / 2, 0.08, 0.92),
                reason: "collision",
              });
            }
          }

          links.forEach((link) => {
            if (link.sourceId !== node.id && link.targetId !== node.id) return;
            const otherId = link.sourceId === node.id ? link.targetId : link.sourceId;
            const other = next.find((candidate) => candidate.id === otherId);
            if (!other) return;
            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const dist = Math.hypot(dx, dy) + 0.001;
            const restLength = 0.18;
            const spring = (dist - restLength) * 0.04 * link.weight;
            fx += (dx / dist) * spring;
            fy += (dy / dist) * spring;
          });

          const centerDx = 0.5 - node.x;
          const centerDy = 0.5 - node.y;
          fx += centerDx * 0.002;
          fy += centerDy * 0.002;

          const energyBoost = 0.8 + audioEnergy * 1.4;
          node.vx = (node.vx + fx) * 0.92;
          node.vy = (node.vy + fy) * 0.92;
          node.x = clamp(node.x + node.vx * delta * energyBoost, 0.05, 0.95);
          node.y = clamp(node.y + node.vy * delta * energyBoost, 0.05, 0.95);

          if (node.x <= 0.05 || node.x >= 0.95) node.vx *= -0.7;
          if (node.y <= 0.05 || node.y >= 0.95) node.vy *= -0.7;
        }
        return next;
      });

      setTags((prev) => {
        const now = Date.now();
        return prev.filter((tag) => now - tag.createdAt < tag.ttl);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [links, mode]);

  return (
    <div className={`app mode-${mode.toLowerCase()}`} style={{ "--energy": energy }}>
      <div className="field" />
      <button
        type="button"
        className="mode-toggle"
        onClick={toggleMode}
        aria-label={mode === "PLAY" ? "Reprendre la main" : "Faire résonner"}
      >
        {mode === "PLAY" ? "■" : "▶"}
      </button>
      <div
        ref={graphRef}
        className="graph-area"
        onPointerDown={handleCanvasPointerDown}
        onPointerUp={handleCanvasPointerUp}
      >
        <svg className="graph-links" viewBox="0 0 100 100" preserveAspectRatio="none">
          {linkPaths.map(({ link, source, target }) => {
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2 - 0.06;
            const path = `M ${source.x * 100} ${source.y * 100} Q ${
              midX * 100
            } ${midY * 100} ${target.x * 100} ${target.y * 100}`;
            return (
              <path
                key={link.id}
                d={path}
                style={{ opacity: 0.25 + link.weight * 0.6 }}
              />
            );
          })}
        </svg>

        {nodes.map((node) => (
          <button
            key={node.id}
            type="button"
            className="node"
            style={{ left: `${node.x * 100}%`, top: `${node.y * 100}%` }}
            onPointerDown={(event) => handleNodePointerDown(event, node.id)}
            onPointerMove={handleNodePointerMove}
            onPointerUp={handleNodePointerUp}
          >
            <span>{node.symbol}</span>
          </button>
        ))}

        {nodes.length === 0 ? (
          <div className="prompt">
            <span>{PROMPT}</span>
          </div>
        ) : null}

        {mode === "PLAY" ? (
          <div className="tags-layer" aria-hidden="true">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="tag"
                style={{
                  left: `${tag.x * 100}%`,
                  top: `${tag.y * 100}%`,
                  animationDuration: `${tag.ttl}ms`,
                }}
              >
                {tag.text}
              </span>
            ))}
          </div>
        ) : null}

        <div className="controls">
          <button
            type="button"
            className="control ghost"
            onClick={() => setPicker({ open: true, x: 0.5, y: 0.5 })}
            aria-label="Ajouter un emoji"
          >
            +
          </button>
        </div>

        {picker.open ? (
          <div
            className="picker"
            style={{ left: `${picker.x * 100}%`, top: `${picker.y * 100}%` }}
          >
            <div className="picker-grid">
              {EMOJI_LIBRARY.map((entry) => (
                <button
                  type="button"
                  key={entry.symbol}
                  onClick={() => addEmoji(entry.symbol)}
                >
                  {entry.symbol}
                </button>
              ))}
            </div>
            <button type="button" className="picker-close" onClick={closePicker}>
              Annuler
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
