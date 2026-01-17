function Controls({ isPlaying, onTogglePlay, onReset, onSave }) {
  return (
    <section className="panel controls">
      <button type="button" className="controls__button" onClick={onTogglePlay}>
        {isPlaying ? "⏸" : "▶️"}
      </button>
      <button type="button" className="controls__button" onClick={onReset}>
        ♻️
      </button>
      <button type="button" className="controls__button" onClick={onSave}>
        💾
      </button>
    </section>
  );
}

export default Controls;
