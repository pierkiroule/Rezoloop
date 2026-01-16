const EMOJI_LIBRARY = [
  { symbol: "🌊", type: "fluid", weight: 0.9 },
  { symbol: "🌫️", type: "mist", weight: 0.7 },
  { symbol: "🔥", type: "kinetic", weight: 1.0 },
  { symbol: "⚡", type: "pulse", weight: 1.0 },
  { symbol: "🌱", type: "organic", weight: 0.8 },
  { symbol: "🪨", type: "mineral", weight: 0.6 },
  { symbol: "🪐", type: "orbit", weight: 0.85 },
  { symbol: "🧭", type: "vector", weight: 0.75 },
  { symbol: "🪞", type: "reflective", weight: 0.7 },
  { symbol: "🧵", type: "thread", weight: 0.65 },
  { symbol: "🌙", type: "nocturne", weight: 0.6 },
  { symbol: "✨", type: "spark", weight: 0.95 },
];

const EMOJI_GRAMMAR = {
  fluid: {
    animation: { flow: 0.9, turbulence: 0.4 },
    audio: { texture: 0.7, energy: 0.3 },
    text: { opacity: 0.65, fragmentation: 0.2 },
  },
  mist: {
    animation: { flow: 0.6, turbulence: 0.5 },
    audio: { texture: 0.9, energy: 0.2 },
    text: { opacity: 0.5, fragmentation: 0.35 },
  },
  kinetic: {
    animation: { flow: 0.4, turbulence: 0.9 },
    audio: { texture: 0.4, energy: 0.95 },
    text: { opacity: 0.4, fragmentation: 0.6 },
  },
  pulse: {
    animation: { flow: 0.5, turbulence: 0.8 },
    audio: { texture: 0.3, energy: 1.0 },
    text: { opacity: 0.35, fragmentation: 0.65 },
  },
  organic: {
    animation: { flow: 0.7, turbulence: 0.5 },
    audio: { texture: 0.6, energy: 0.4 },
    text: { opacity: 0.7, fragmentation: 0.25 },
  },
  mineral: {
    animation: { flow: 0.3, turbulence: 0.2 },
    audio: { texture: 0.5, energy: 0.2 },
    text: { opacity: 0.8, fragmentation: 0.15 },
  },
  orbit: {
    animation: { flow: 0.65, turbulence: 0.3 },
    audio: { texture: 0.6, energy: 0.35 },
    text: { opacity: 0.6, fragmentation: 0.3 },
  },
  vector: {
    animation: { flow: 0.55, turbulence: 0.6 },
    audio: { texture: 0.45, energy: 0.6 },
    text: { opacity: 0.5, fragmentation: 0.45 },
  },
  reflective: {
    animation: { flow: 0.4, turbulence: 0.25 },
    audio: { texture: 0.8, energy: 0.25 },
    text: { opacity: 0.85, fragmentation: 0.15 },
  },
  thread: {
    animation: { flow: 0.6, turbulence: 0.4 },
    audio: { texture: 0.5, energy: 0.3 },
    text: { opacity: 0.75, fragmentation: 0.2 },
  },
  nocturne: {
    animation: { flow: 0.45, turbulence: 0.35 },
    audio: { texture: 0.7, energy: 0.2 },
    text: { opacity: 0.9, fragmentation: 0.1 },
  },
  spark: {
    animation: { flow: 0.75, turbulence: 0.85 },
    audio: { texture: 0.4, energy: 0.8 },
    text: { opacity: 0.45, fragmentation: 0.7 },
  },
};

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

const createGraphNode = ({ symbol, position }) => {
  const libraryEntry = EMOJI_LIBRARY.find((entry) => entry.symbol === symbol);
  const type = libraryEntry?.type ?? "fluid";
  const weight = libraryEntry?.weight ?? 0.8;
  return {
    id: createId(),
    symbol,
    type,
    weight,
    x: clamp(position.x),
    y: clamp(position.y),
    createdAt: Date.now(),
  };
};

const createGraphLink = ({ sourceId, targetId, weight }) => ({
  id: createId(),
  sourceId,
  targetId,
  weight: clamp(weight, 0.1, 1),
  createdAt: Date.now(),
});

const computeGraphMetrics = (nodes, links) => {
  const nodeCount = nodes.length;
  const linkCount = links.length;
  const maxLinks = nodeCount > 1 ? (nodeCount * (nodeCount - 1)) / 2 : 1;
  const density = linkCount / maxLinks;
  const degrees = nodes.reduce((acc, node) => {
    acc[node.id] = 0;
    return acc;
  }, {});
  links.forEach((link) => {
    if (degrees[link.sourceId] !== undefined) degrees[link.sourceId] += 1;
    if (degrees[link.targetId] !== undefined) degrees[link.targetId] += 1;
  });
  const degreeValues = Object.values(degrees);
  const meanDegree = degreeValues.length
    ? degreeValues.reduce((sum, value) => sum + value, 0) / degreeValues.length
    : 0;
  const centrality = degreeValues.length
    ? Math.max(...degreeValues) / Math.max(nodeCount - 1, 1)
    : 0;
  const averageWeight = linkCount
    ? links.reduce((sum, link) => sum + link.weight, 0) / linkCount
    : 0;
  return {
    nodeCount,
    linkCount,
    density: clamp(density),
    meanDegree: clamp(meanDegree / Math.max(nodeCount, 1)),
    centrality: clamp(centrality),
    averageWeight,
  };
};

const deriveTransmediaParameters = (nodes, links) => {
  const metrics = computeGraphMetrics(nodes, links);
  const totals = {
    animation: { flow: 0, turbulence: 0 },
    audio: { texture: 0, energy: 0 },
    text: { opacity: 0, fragmentation: 0 },
  };

  nodes.forEach((node) => {
    const grammar = EMOJI_GRAMMAR[node.type] ?? EMOJI_GRAMMAR.fluid;
    Object.keys(totals).forEach((channel) => {
      Object.keys(totals[channel]).forEach((key) => {
        totals[channel][key] += grammar[channel][key] * node.weight;
      });
    });
  });

  const divisor = Math.max(nodes.length, 1);
  const normalize = (value) => clamp(value / divisor);

  const animation = {
    flow: normalize(totals.animation.flow),
    turbulence: normalize(totals.animation.turbulence),
    loopSeconds: Math.round(18 + (1 - metrics.density) * 32),
  };
  const audio = {
    texture: normalize(totals.audio.texture),
    energy: normalize(totals.audio.energy),
    grain: clamp(metrics.centrality * 0.6 + metrics.averageWeight * 0.4),
  };
  const text = {
    opacity: normalize(totals.text.opacity),
    fragmentation: normalize(totals.text.fragmentation),
    pace: clamp(0.4 + metrics.meanDegree * 0.6),
  };

  return { metrics, animation, audio, text };
};

export {
  EMOJI_LIBRARY,
  EMOJI_GRAMMAR,
  createGraphNode,
  createGraphLink,
  computeGraphMetrics,
  deriveTransmediaParameters,
};
