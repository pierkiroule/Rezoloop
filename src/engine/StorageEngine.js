class StorageEngine {
  constructor(storageKey = "cosmoji-constellations") {
    this.storageKey = storageKey;
  }

  list() {
    return this.loadAll().map(({ id, createdAt, bubbles }) => ({
      id,
      createdAt,
      count: bubbles.length,
    }));
  }

  save(bubbles) {
    const entries = this.loadAll();
    const entry = {
      id: `constellation-${Date.now()}`,
      createdAt: new Date().toISOString(),
      bubbles: bubbles.map((bubble) => ({
        emoji: bubble.emoji,
        radius: bubble.radius,
        position: { ...bubble.position },
        velocity: { ...bubble.velocity },
      })),
    };
    entries.unshift(entry);
    localStorage.setItem(this.storageKey, JSON.stringify(entries));
    return entry;
  }

  load(id) {
    const entry = this.loadAll().find((item) => item.id === id);
    return entry ? entry.bubbles : null;
  }

  loadAll() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn("Failed to parse stored constellations", error);
      return [];
    }
  }
}

export default StorageEngine;
