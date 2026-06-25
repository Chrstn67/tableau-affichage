import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import "./DocumentGrid.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const thumbnailCache = new Map();

function PdfThumbnail({ url, alt }) {
  const imgRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!url) {
        setStatus("error");
        return;
      }

      if (thumbnailCache.has(url)) {
        drawFromDataUrl(thumbnailCache.get(url));
        return;
      }

      try {
        setStatus("loading");
        const pdf = await pdfjsLib.getDocument(url).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const scale = 400 / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        await page.render({
          canvasContext: canvas.getContext("2d"),
          viewport: scaledViewport,
        }).promise;

        if (cancelled) return;
        const dataUrl = canvas.toDataURL("image/png");
        thumbnailCache.set(url, dataUrl);
        drawFromDataUrl(dataUrl);
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    function drawFromDataUrl(dataUrl) {
      if (cancelled || !imgRef.current) return;
      imgRef.current.src = dataUrl;
      setStatus("done");
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="thumb">
      {status === "loading" && <span className="thumb-spinner" />}
      {status === "error" && <span className="thumb-pdf-icon">PDF</span>}
      <img
        ref={imgRef}
        alt={alt}
        className="thumb-img"
        style={{ display: status === "done" ? "block" : "none" }}
      />
    </div>
  );
}

function isNew(createdAt) {
  return Date.now() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;
}

function DocumentCard({ doc, isAdmin, onDelete, onEdit }) {
  const categoryLabel = [doc.category_name, doc.subcategory_name]
    .filter(Boolean)
    .join(" › ");

  return (
    <div className="doc-card">
      <a
        href={doc.file_url}
        target="_blank"
        rel="noreferrer"
        className="doc-thumb-link"
      >
        {isNew(doc.created_at) && (
          <span className="badge-new" aria-label="Nouveau document">
            Nouveau
          </span>
        )}
        <PdfThumbnail url={doc.file_url} alt={doc.title} />
      </a>

      <div className="doc-body">
        <p className="doc-title" title={doc.title}>
          {doc.title}
        </p>
        {categoryLabel && <span className="doc-tag">{categoryLabel}</span>}
        <span className="doc-date">
          {new Date(doc.created_at).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="doc-footer">
        <a
          className="btn-open"
          href={doc.file_url}
          target="_blank"
          rel="noreferrer"
        >
          Ouvrir
        </a>
        {isAdmin && (
          <>
            <button
              className="btn-icon"
              onClick={() => onEdit(doc)}
              title="Modifier"
            >
              ✏️
            </button>
            <button
              className="btn-icon danger"
              onClick={() => onDelete(doc)}
              title="Supprimer"
            >
              🗑
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, count }) {
  return (
    <div className="section-header">
      <div className="section-icon">{icon}</div>
      <span className="section-title">{title}</span>
      {count != null && <span className="section-count">{count}</span>}
    </div>
  );
}

export default function DocumentGrid({
  documents,
  isAdmin,
  onDelete,
  onEdit,
  loading,
  mode,
}) {
  if (loading) return <p className="doc-empty">Chargement des documents…</p>;

  if (mode === "home") {
    const recent = documents.filter((d) => isNew(d.created_at));
    return (
      <div className="doc-layout">
        <SectionHeader icon="✨" title="Nouveautés" count={recent.length} />
        {recent.length === 0 ? (
          <p className="doc-empty">
            Aucune nouveauté cette semaine — revenez bientôt&nbsp;!
          </p>
        ) : (
          <div className="doc-grid">
            {recent.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                isAdmin={isAdmin}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (documents.length === 0)
    return <p className="doc-empty">Aucun document dans cette section.</p>;

  return (
    <div className="doc-layout">
      <SectionHeader
        icon="📁"
        title="Tous les documents"
        count={documents.length}
      />
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
    </div>
  );
}
