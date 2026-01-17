function Gallery({ items, onLoad }) {
  return (
    <section className="panel gallery">
      <div className="panel__title">Galerie</div>
      {items.length === 0 ? (
        <p className="gallery__empty">Aucune constellation sauvegardée.</p>
      ) : (
        <ul className="gallery__list">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => onLoad?.(item.id)}>
                {new Date(item.createdAt).toLocaleDateString()} · {item.count} emojis
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default Gallery;
