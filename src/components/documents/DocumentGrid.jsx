import DocumentCard from "./DocumentCard";

export default function DocumentGrid({
  documents,
  isAdmin,
  onDelete,
  onEdit,
  loading,
}) {
  if (loading)
    if (loading) {
      return (
        <p
          className="empty-state"
          style={{
            textAlign: "center",
            fontSize: "0.9rem",
            color: "#8a8078",
            padding: "3rem 1rem",
            fontStyle: "italic",
          }}
        >
          Chargement des documents...
        </p>
      );
    }

  if (documents.length === 0) {
    return (
      <p
        className="empty-state"
        style={{
          textAlign: "center",
          fontSize: "0.9rem",
          color: "#8a8078",
          padding: "3rem 1rem",
          fontStyle: "italic",
        }}
      >
        Aucun document dans cette section.
      </p>
    );
  }

  return (
    <div className="doc-grid">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          doc={doc}
          isAdmin={isAdmin}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
