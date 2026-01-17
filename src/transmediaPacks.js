const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

const INTENTION_OPTIONS = [
  { id: "exploration", label: "Exploration" },
  { id: "apaisement", label: "Apaisement" },
  { id: "expansion", label: "Expansion" },
  { id: "ancrage", label: "Ancrage" },
];

const PUBLIC_OPTIONS = [
  { id: "adolescent", label: "Adolescent" },
  { id: "groupe", label: "Groupe" },
  { id: "individuel", label: "Individuel" },
  { id: "atelier", label: "Atelier" },
];

const TRANSMEDIA_PACKS = [
  {
    id: "flux_lent_ado",
    label: "Flux lent",
    intentions: ["apaisement", "exploration"],
    publics: ["adolescent", "groupe"],
    resources: {
      videos: [
        {
          id: "video-flux-01",
          label: "Courant élastique",
          latentProfile: {
            density: 0.35,
            tension: 0.25,
            rhythm: 0.4,
            heterogeneity: 0.3,
            spread: 0.7,
            silenceRatio: 0.45,
          },
        },
        {
          id: "video-flux-02",
          label: "Lentilles mouvantes",
          latentProfile: {
            density: 0.5,
            tension: 0.35,
            rhythm: 0.45,
            heterogeneity: 0.35,
            spread: 0.6,
            silenceRatio: 0.4,
          },
        },
      ],
      audios: [
        {
          id: "audio-flux-01",
          label: "Dérive basse",
          latentProfile: {
            density: 0.3,
            tension: 0.2,
            rhythm: 0.35,
            heterogeneity: 0.25,
            spread: 0.65,
            silenceRatio: 0.55,
          },
        },
        {
          id: "audio-flux-02",
          label: "Marée douce",
          latentProfile: {
            density: 0.4,
            tension: 0.3,
            rhythm: 0.45,
            heterogeneity: 0.3,
            spread: 0.6,
            silenceRatio: 0.45,
          },
        },
      ],
      texts: [
        {
          id: "text-flux-01",
          label: "Fragments brume",
          latentProfile: {
            density: 0.4,
            tension: 0.25,
            rhythm: 0.35,
            heterogeneity: 0.4,
            spread: 0.55,
            silenceRatio: 0.6,
          },
        },
        {
          id: "text-flux-02",
          label: "Phrases diluées",
          latentProfile: {
            density: 0.35,
            tension: 0.2,
            rhythm: 0.3,
            heterogeneity: 0.35,
            spread: 0.65,
            silenceRatio: 0.65,
          },
        },
      ],
    },
  },
  {
    id: "ateliers_vifs",
    label: "Atelier vif",
    intentions: ["exploration", "expansion"],
    publics: ["atelier", "groupe"],
    resources: {
      videos: [
        {
          id: "video-vif-01",
          label: "Pulses croisés",
          latentProfile: {
            density: 0.65,
            tension: 0.7,
            rhythm: 0.8,
            heterogeneity: 0.6,
            spread: 0.45,
            silenceRatio: 0.2,
          },
        },
        {
          id: "video-vif-02",
          label: "Grilles vibrantes",
          latentProfile: {
            density: 0.7,
            tension: 0.65,
            rhythm: 0.75,
            heterogeneity: 0.55,
            spread: 0.4,
            silenceRatio: 0.25,
          },
        },
      ],
      audios: [
        {
          id: "audio-vif-01",
          label: "Impulsions claires",
          latentProfile: {
            density: 0.6,
            tension: 0.7,
            rhythm: 0.85,
            heterogeneity: 0.55,
            spread: 0.35,
            silenceRatio: 0.15,
          },
        },
        {
          id: "audio-vif-02",
          label: "Circuits nerveux",
          latentProfile: {
            density: 0.65,
            tension: 0.75,
            rhythm: 0.8,
            heterogeneity: 0.6,
            spread: 0.4,
            silenceRatio: 0.2,
          },
        },
      ],
      texts: [
        {
          id: "text-vif-01",
          label: "Éclats courts",
          latentProfile: {
            density: 0.55,
            tension: 0.6,
            rhythm: 0.75,
            heterogeneity: 0.7,
            spread: 0.4,
            silenceRatio: 0.2,
          },
        },
        {
          id: "text-vif-02",
          label: "Intervalles serrés",
          latentProfile: {
            density: 0.6,
            tension: 0.65,
            rhythm: 0.7,
            heterogeneity: 0.65,
            spread: 0.35,
            silenceRatio: 0.25,
          },
        },
      ],
    },
  },
  {
    id: "ancrage_individuel",
    label: "Ancrage",
    intentions: ["apaisement", "ancrage"],
    publics: ["individuel"],
    resources: {
      videos: [
        {
          id: "video-ancrage-01",
          label: "Respiration lente",
          latentProfile: {
            density: 0.25,
            tension: 0.2,
            rhythm: 0.3,
            heterogeneity: 0.25,
            spread: 0.7,
            silenceRatio: 0.6,
          },
        },
        {
          id: "video-ancrage-02",
          label: "Oscillation large",
          latentProfile: {
            density: 0.3,
            tension: 0.25,
            rhythm: 0.35,
            heterogeneity: 0.3,
            spread: 0.75,
            silenceRatio: 0.55,
          },
        },
      ],
      audios: [
        {
          id: "audio-ancrage-01",
          label: "Basse stable",
          latentProfile: {
            density: 0.35,
            tension: 0.25,
            rhythm: 0.25,
            heterogeneity: 0.2,
            spread: 0.6,
            silenceRatio: 0.65,
          },
        },
        {
          id: "audio-ancrage-02",
          label: "Souffle ample",
          latentProfile: {
            density: 0.3,
            tension: 0.2,
            rhythm: 0.3,
            heterogeneity: 0.25,
            spread: 0.65,
            silenceRatio: 0.7,
          },
        },
      ],
      texts: [
        {
          id: "text-ancrage-01",
          label: "Notes continues",
          latentProfile: {
            density: 0.3,
            tension: 0.2,
            rhythm: 0.25,
            heterogeneity: 0.2,
            spread: 0.7,
            silenceRatio: 0.7,
          },
        },
        {
          id: "text-ancrage-02",
          label: "Segments lents",
          latentProfile: {
            density: 0.25,
            tension: 0.2,
            rhythm: 0.2,
            heterogeneity: 0.25,
            spread: 0.75,
            silenceRatio: 0.75,
          },
        },
      ],
    },
  },
];

const filterPacksByContext = (packs, usageContext) => {
  const intentions = usageContext.intentions ?? [];
  const publics = usageContext.publics ?? [];
  const hasIntentions = intentions.length > 0;
  const hasPublics = publics.length > 0;

  if (!hasIntentions && !hasPublics) return packs;

  return packs.filter((pack) => {
    const matchIntentions = !hasIntentions
      ? true
      : pack.intentions.some((intention) => intentions.includes(intention));
    const matchPublics = !hasPublics
      ? true
      : pack.publics.some((publicId) => publics.includes(publicId));
    return matchIntentions && matchPublics;
  });
};

const toLatentProfile = (resoParams) => ({
  density: clamp(resoParams.metrics.density),
  tension: clamp(resoParams.animation.turbulence),
  rhythm: clamp((resoParams.audio.energy + resoParams.text.pace) / 2),
  heterogeneity: clamp(
    (resoParams.text.fragmentation + resoParams.metrics.centrality) / 2
  ),
  spread: clamp(resoParams.animation.flow),
  silenceRatio: clamp(1 - (resoParams.audio.energy * 0.7 + resoParams.audio.texture * 0.3)),
});

const computeDistance = (target, candidate) => {
  const keys = Object.keys(target);
  const total = keys.reduce((sum, key) => {
    const delta = target[key] - candidate[key];
    return sum + delta * delta;
  }, 0);
  return Math.sqrt(total / keys.length);
};

const matchResources = (resoParams, resources, selectionSize = 3) => {
  if (!resources || resources.length === 0) return null;
  const targetProfile = toLatentProfile(resoParams);
  const scored = resources
    .map((resource) => ({
      resource,
      distance: computeDistance(targetProfile, resource.latentProfile),
    }))
    .sort((a, b) => a.distance - b.distance);
  const sample = scored.slice(0, Math.min(selectionSize, scored.length));
  const pick = sample[Math.floor(Math.random() * sample.length)];
  return pick.resource;
};

const matchPackResources = (resoParams, pack) => ({
  video: matchResources(resoParams, pack.resources.videos),
  audio: matchResources(resoParams, pack.resources.audios),
  text: matchResources(resoParams, pack.resources.texts),
});

export {
  INTENTION_OPTIONS,
  PUBLIC_OPTIONS,
  TRANSMEDIA_PACKS,
  filterPacksByContext,
  matchPackResources,
};
