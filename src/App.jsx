import { useMemo, useRef, useState } from "react";
import {
  EMOJI_LIBRARY,
  createGraphLink,
  createGraphNode,
  deriveTransmediaParameters,
} from "./graphModel";

const PROMPT = "Dépose ce qui est là, en emojis.";
const RESONANCE_LABEL = "Faire résonner";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getRelativePosition = (event, rect) => {
  const x = clamp((event.clientX - rect.left) / rect.width, 0.05, 0.95);
  const y = clamp((event.clientY - rect.top) / rect.height, 0.05, 0.95);
  return { x, y };
};

export default function App() {
  const graphRef = useRef(null);
  const longPressRef = useRef(null);
  const dragRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [picker, setPicker] = useState({ open: false, x: 0.5, y: 0.5 });
  const [resonance, setResonance] = useState(null);

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

  const addEmoji = (symbol) => {
    setNodes((prev) => [
      ...prev,
      createGraphNode({ symbol, position: { x: picker.x, y: picker.y } }),
    ]);
    setPicker((prev) => ({ ...prev, open: false }));
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
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleNodePointerMove = (event) => {
    if (!dragRef.current) return;
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
      }
    }
  };

  const handleResonance = () => {
    if (!nodes.length) return;
    setResonance(deriveTransmediaParameters(nodes, links));
  };

  const clearResonance = () => setResonance(null);
  const closePicker = () => setPicker((prev) => ({ ...prev, open: false }));

  return (
    <div className="app">
      <div className="field" />
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
                style={{ opacity: 0.3 + link.weight * 0.6 }}
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

        <div className="controls">
          <button
            type="button"
            className="control ghost"
            onClick={() => setPicker({ open: true, x: 0.5, y: 0.5 })}
          >
            + Ajouter
          </button>
          <button
            type="button"
            className="control"
            onClick={handleResonance}
            disabled={!nodes.length}
          >
            {RESONANCE_LABEL}
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

      {resonance ? (
        <div className="resonance" role="dialog" aria-live="polite">
          <div className="resonance-header">
            <span>Matrice de résonance</span>
            <button type="button" onClick={clearResonance}>
              Fermer
            </button>
          </div>
          <div className="resonance-grid">
            <div>
              <h4>Graphe</h4>
              <p>Densité: {resonance.metrics.density.toFixed(2)}</p>
              <p>Centralité: {resonance.metrics.centrality.toFixed(2)}</p>
              <p>Poids moyen: {resonance.metrics.averageWeight.toFixed(2)}</p>
            </div>
            <div>
              <h4>Animation</h4>
              <p>Flux: {resonance.animation.flow.toFixed(2)}</p>
              <p>Turbulence: {resonance.animation.turbulence.toFixed(2)}</p>
              <p>Loop: {resonance.animation.loopSeconds}s</p>
            </div>
            <div>
              <h4>Audio</h4>
              <p>Texture: {resonance.audio.texture.toFixed(2)}</p>
              <p>Énergie: {resonance.audio.energy.toFixed(2)}</p>
              <p>Grain: {resonance.audio.grain.toFixed(2)}</p>
            </div>
            <div>
              <h4>Texte</h4>
              <p>Opacité: {resonance.text.opacity.toFixed(2)}</p>
              <p>Fragmentation: {resonance.text.fragmentation.toFixed(2)}</p>
              <p>Rythme: {resonance.text.pace.toFixed(2)}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
