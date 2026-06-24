import "./DocumentCard.css";

export default function DocumentCard({ doc, isAdmin, onDelete, onEdit }) {
  return (
    <div className="doc-card">
      <a
        href={doc.file_url}
        target="_blank"
        rel="noreferrer"
        className="doc-thumb"
      >
        <span className="doc-icon">PDF</span>
      </a>
      <div className="doc-info">
        <h3 title={doc.title}>{doc.title}</h3>
        <p className="doc-meta">
          {doc.category_name}{" "}
          {doc.subcategory_name ? `› ${doc.subcategory_name}` : ""}
        </p>
        <p className="doc-date">
          {new Date(doc.created_at).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>
      </div>
      <div className="doc-actions">
        <a
          className="btn-link"
          href={doc.file_url}
          target="_blank"
          rel="noreferrer"
        >
          Ouvrir
        </a>
        {isAdmin && (
          <>
            <button className="btn-link" onClick={() => onEdit(doc)}>
              Modifier
            </button>
            <button className="btn-link danger" onClick={() => onDelete(doc)}>
              Supprimer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
