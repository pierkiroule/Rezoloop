const EMOJIS = ["🌙", "🪐", "✨", "☄️", "🌌", "🌀", "🌟", "💫", "🌑", "🛰️", "🌕", "🌗", "🌘", "🌞", "🪐"];

function EmojiDeck({ onAddEmoji }) {
  return (
    <section className="panel emoji-deck">
      <div className="panel__title">Emojis</div>
      <div className="emoji-deck__grid">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="emoji-deck__item"
            onClick={() => onAddEmoji?.(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </section>
  );
}

export default EmojiDeck;
