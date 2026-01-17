import { useEffect, useMemo, useRef, useState } from "react";
import RenderEngine from "./engine/RenderEngine";
import WorldEngine from "./engine/WorldEngine";
import InteractionEngine from "./engine/InteractionEngine";
import StorageEngine from "./engine/StorageEngine";
import EmojiDeck from "./ui/EmojiDeck";
import Controls from "./ui/Controls";
import Gallery from "./ui/Gallery";

const INITIAL_EMOJIS = ["🌙", "🪐", "✨", "☄️", "🌌", "🌀", "🌟", "💫", "🌑", "🛰️"];

const buildInitialBubbles = (world) =>
  INITIAL_EMOJIS.map((emoji, index) => world.createBubble(emoji, index));

function App() {
  const containerRef = useRef(null);
  const enginesRef = useRef(null);
  const animationRef = useRef({ frame: null, lastTime: 0 });
  const isPlayingRef = useRef(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [galleryItems, setGalleryItems] = useState([]);

  const storage = useMemo(() => new StorageEngine(), []);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const world = new WorldEngine();
    const render = new RenderEngine(container, { radius: world.radius });
    const interaction = new InteractionEngine(container, render, world, {
      onTap: (point) => world.applyRadialImpulse(point),
    });

    const initialBubbles = buildInitialBubbles(world);
    world.setBubbles(initialBubbles);
    render.syncBubbles(world.bubbles);

    enginesRef.current = { world, render, interaction };
    setGalleryItems(storage.list());

    const loop = (time) => {
      const elapsed = (time - animationRef.current.lastTime) / 1000 || 0;
      animationRef.current.lastTime = time;

      if (isPlayingRef.current) {
        world.update(elapsed);
      }
      render.render(world.bubbles);
      animationRef.current.frame = requestAnimationFrame(loop);
    };

    animationRef.current.frame = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current.frame) {
        cancelAnimationFrame(animationRef.current.frame);
      }
      interaction.dispose();
      render.dispose();
    };
  }, [storage]);

  const handleAddEmoji = (emoji) => {
    const engines = enginesRef.current;
    if (!engines) return;
    const bubble = engines.world.addBubble(emoji);
    engines.render.syncBubbles(engines.world.bubbles);
    return bubble;
  };

  const handleReset = () => {
    const engines = enginesRef.current;
    if (!engines) return;
    const fresh = buildInitialBubbles(engines.world);
    engines.world.setBubbles(fresh);
    engines.render.syncBubbles(engines.world.bubbles);
  };

  const handleSave = () => {
    const engines = enginesRef.current;
    if (!engines) return;
    storage.save(engines.world.bubbles);
    setGalleryItems(storage.list());
  };

  const handleLoad = (id) => {
    const engines = enginesRef.current;
    if (!engines) return;
    const bubbles = storage.load(id);
    if (!bubbles) return;
    engines.world.loadBubbles(bubbles);
    engines.render.syncBubbles(engines.world.bubbles);
    setIsPlaying(true);
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>Cosmoji Transmédiation</h1>
      </header>

      <main className="app__main">
        <div className="stage" ref={containerRef} />

        <Controls
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((prev) => !prev)}
          onReset={handleReset}
          onSave={handleSave}
        />

        <EmojiDeck onAddEmoji={handleAddEmoji} />

        <Gallery items={galleryItems} onLoad={handleLoad} />
      </main>
    </div>
  );
}

export default App;
