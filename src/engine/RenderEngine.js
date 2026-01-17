import * as THREE from "three";

class RenderEngine {
  constructor(container, { radius = 1 } = {}) {
    this.container = container;
    this.radius = radius;
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.camera.position.z = 5;

    this.textureCache = new Map();
    this.spriteMap = new Map();

    this.circleLine = this.createBoundary();
    this.scene.add(this.circleLine);

    this.container.appendChild(this.renderer.domElement);
    this.resize();

    this.handleResize = () => this.resize();
    window.addEventListener("resize", this.handleResize);
  }

  createBoundary() {
    const segments = 120;
    const points = [];
    for (let i = 0; i <= segments; i += 1) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * this.radius, Math.sin(angle) * this.radius, 0));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0x5d6bff, transparent: true, opacity: 0.6 });
    return new THREE.LineLoop(geometry, material);
  }

  createEmojiTexture(emoji) {
    if (this.textureCache.has(emoji)) {
      return this.textureCache.get(emoji);
    }
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = "160px serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(emoji, canvas.width / 2, canvas.height / 2 + 10);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    this.textureCache.set(emoji, texture);
    return texture;
  }

  createSprite(bubble) {
    const texture = this.createEmojiTexture(bubble.emoji);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    const scale = bubble.radius * 2;
    sprite.scale.set(scale, scale, 1);
    this.scene.add(sprite);
    this.spriteMap.set(bubble.id, sprite);
  }

  syncBubbles(bubbles) {
    const ids = new Set(bubbles.map((bubble) => bubble.id));
    bubbles.forEach((bubble) => {
      if (!this.spriteMap.has(bubble.id)) {
        this.createSprite(bubble);
      }
    });

    this.spriteMap.forEach((sprite, id) => {
      if (!ids.has(id)) {
        this.scene.remove(sprite);
        this.spriteMap.delete(id);
      }
    });
  }

  render(bubbles) {
    bubbles.forEach((bubble) => {
      const sprite = this.spriteMap.get(bubble.id);
      if (!sprite) return;
      sprite.position.set(bubble.position.x, bubble.position.y, 0);
    });

    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const { clientWidth, clientHeight } = this.container;
    const aspect = clientWidth / clientHeight || 1;
    this.camera.left = -aspect;
    this.camera.right = aspect;
    this.camera.top = 1;
    this.camera.bottom = -1;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight, false);
  }

  screenToWorld(point) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((point.x - rect.left) / rect.width) * 2 - 1;
    const y = -(((point.y - rect.top) / rect.height) * 2 - 1);
    return {
      x: x * this.camera.right,
      y: y * this.camera.top,
    };
  }

  dispose() {
    window.removeEventListener("resize", this.handleResize);
    this.renderer.dispose();
    this.spriteMap.forEach((sprite) => {
      sprite.material.dispose();
    });
    this.textureCache.forEach((texture) => texture.dispose());
  }
}

export default RenderEngine;
