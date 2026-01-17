class InteractionEngine {
  constructor(container, renderEngine, worldEngine, { onTap } = {}) {
    this.container = container;
    this.renderEngine = renderEngine;
    this.worldEngine = worldEngine;
    this.onTap = onTap;

    this.activeBubble = null;
    this.lastPosition = null;
    this.lastWorldPosition = null;
    this.lastTime = 0;
    this.tapThreshold = 8;

    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);

    this.container.addEventListener("pointerdown", this.handlePointerDown, { passive: false });
    window.addEventListener("pointermove", this.handlePointerMove, { passive: false });
    window.addEventListener("pointerup", this.handlePointerUp, { passive: false });
  }

  handlePointerDown(event) {
    event.preventDefault();
    const point = this.renderEngine.screenToWorld({ x: event.clientX, y: event.clientY });
    const bubble = this.worldEngine.findBubbleAt(point);
    this.activeBubble = bubble || null;
    this.lastPosition = { x: event.clientX, y: event.clientY };
    this.lastWorldPosition = point;
    this.lastTime = performance.now();

    if (bubble) {
      bubble.isDragged = true;
      bubble.velocity.x = 0;
      bubble.velocity.y = 0;
      bubble.position.x = point.x;
      bubble.position.y = point.y;
    }
  }

  handlePointerMove(event) {
    if (!this.activeBubble) return;
    event.preventDefault();
    const point = this.renderEngine.screenToWorld({ x: event.clientX, y: event.clientY });
    const bubble = this.activeBubble;
    bubble.position.x = point.x;
    bubble.position.y = point.y;

    this.lastPosition = { x: event.clientX, y: event.clientY };
    this.lastWorldPosition = point;
    this.lastTime = performance.now();
  }

  handlePointerUp(event) {
    const now = performance.now();
    const point = this.renderEngine.screenToWorld({ x: event.clientX, y: event.clientY });

    if (this.activeBubble) {
      const bubble = this.activeBubble;
      const deltaTime = Math.max((now - this.lastTime) / 1000, 0.016);
      const lastWorld = this.lastWorldPosition || bubble.position;
      bubble.velocity.x = (point.x - lastWorld.x) / deltaTime;
      bubble.velocity.y = (point.y - lastWorld.y) / deltaTime;
      bubble.isDragged = false;
    } else if (this.lastPosition) {
      const distance = Math.hypot(event.clientX - this.lastPosition.x, event.clientY - this.lastPosition.y);
      if (distance <= this.tapThreshold && this.onTap) {
        this.onTap(point);
      }
    }

    this.activeBubble = null;
    this.lastPosition = null;
    this.lastWorldPosition = null;
  }

  dispose() {
    this.container.removeEventListener("pointerdown", this.handlePointerDown);
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerup", this.handlePointerUp);
  }
}

export default InteractionEngine;
