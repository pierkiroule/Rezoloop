const DEFAULT_RADIUS = 1;
const BASE_SPEED = 0.18;

class WorldEngine {
  constructor({ radius = DEFAULT_RADIUS } = {}) {
    this.radius = radius;
    this.friction = 0.98;
    this.restitution = 0.85;
    this.bubbles = [];
    this._id = 0;
  }

  createBubble(emoji, seed = 0) {
    const angle = (seed / 10) * Math.PI * 2;
    const distance = 0.35 + (seed % 4) * 0.08;
    return {
      id: `bubble-${this._id++}`,
      emoji,
      radius: 0.12,
      position: {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
      },
      velocity: {
        x: (Math.sin(angle) * BASE_SPEED) / 2,
        y: (Math.cos(angle) * BASE_SPEED) / 2,
      },
      isDragged: false,
    };
  }

  addBubble(emoji) {
    const bubble = this.createBubble(emoji, this._id);
    this.bubbles.push(bubble);
    return bubble;
  }

  setBubbles(bubbles) {
    this.bubbles = bubbles;
  }

  loadBubbles(bubbles) {
    this.bubbles = bubbles.map((bubble) => ({
      ...bubble,
      id: `bubble-${this._id++}`,
      isDragged: false,
    }));
  }

  update(delta) {
    if (!delta) return;
    const frictionFactor = Math.pow(this.friction, delta * 60);

    this.bubbles.forEach((bubble) => {
      if (bubble.isDragged) return;
      bubble.velocity.x *= frictionFactor;
      bubble.velocity.y *= frictionFactor;

      bubble.position.x += bubble.velocity.x * delta;
      bubble.position.y += bubble.velocity.y * delta;

      this.applyWallCollision(bubble);
    });

    this.resolveCollisions();
    this.bubbles.forEach((bubble) => this.applyWallCollision(bubble));
  }

  applyWallCollision(bubble) {
    const dx = bubble.position.x;
    const dy = bubble.position.y;
    const distance = Math.hypot(dx, dy);
    const limit = this.radius - bubble.radius;

    if (distance > limit && distance !== 0) {
      const nx = dx / distance;
      const ny = dy / distance;
      bubble.position.x = nx * limit;
      bubble.position.y = ny * limit;

      const dot = bubble.velocity.x * nx + bubble.velocity.y * ny;
      bubble.velocity.x -= (1 + this.restitution) * dot * nx;
      bubble.velocity.y -= (1 + this.restitution) * dot * ny;
    }
  }

  resolveCollisions() {
    for (let i = 0; i < this.bubbles.length; i += 1) {
      for (let j = i + 1; j < this.bubbles.length; j += 1) {
        const a = this.bubbles[i];
        const b = this.bubbles[j];
        if (a.isDragged || b.isDragged) continue;

        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;
        const distance = Math.hypot(dx, dy);
        const minDistance = a.radius + b.radius;

        if (distance < minDistance && distance !== 0) {
          const overlap = (minDistance - distance) / 2;
          const nx = dx / distance;
          const ny = dy / distance;

          a.position.x -= nx * overlap;
          a.position.y -= ny * overlap;
          b.position.x += nx * overlap;
          b.position.y += ny * overlap;

          const relativeVelocityX = b.velocity.x - a.velocity.x;
          const relativeVelocityY = b.velocity.y - a.velocity.y;
          const separatingVelocity = relativeVelocityX * nx + relativeVelocityY * ny;
          const impulse = separatingVelocity * -0.35;

          a.velocity.x -= impulse * nx;
          a.velocity.y -= impulse * ny;
          b.velocity.x += impulse * nx;
          b.velocity.y += impulse * ny;
        }
      }
    }
  }

  applyRadialImpulse(point) {
    this.bubbles.forEach((bubble) => {
      const dx = bubble.position.x - point.x;
      const dy = bubble.position.y - point.y;
      const distance = Math.hypot(dx, dy);
      const strength = Math.max(0, (this.radius - distance) / this.radius);
      if (strength <= 0) return;
      const nx = distance === 0 ? Math.random() - 0.5 : dx / distance;
      const ny = distance === 0 ? Math.random() - 0.5 : dy / distance;
      bubble.velocity.x += nx * strength * 0.7;
      bubble.velocity.y += ny * strength * 0.7;
    });
  }

  findBubbleAt(point) {
    return this.bubbles.find((bubble) => {
      const dx = bubble.position.x - point.x;
      const dy = bubble.position.y - point.y;
      return Math.hypot(dx, dy) <= bubble.radius * 1.2;
    });
  }
}

export default WorldEngine;
