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
    <div className="thumb-wrap">
      {status === "loading" && (
        <div className="thumb-placeholder">
          <span className="thumb-spinner" />
        </div>
      )}
      {status === "error" && (
        <div className="thumb-placeholder thumb-fallback">
          <span className="thumb-icon">PDF</span>
        </div>
      )}
      <img
        ref={imgRef}
        alt={alt}
        className="thumb-img"
        style={{ display: status === "done" ? "block" : "none" }}
      />
    </div>
  );
}

function DocumentCard({ doc, isAdmin, onDelete, onEdit }) {
  return (
    <div className="doc-card">
      <a
        href={doc.file_url}
        target="_blank"
        rel="noreferrer"
        className="doc-thumb"
      >
        <PdfThumbnail url={doc.file_url} alt={doc.title} />
      </a>

      <div className="doc-info">
        <h3 title={doc.title}>{doc.title}</h3>
        <p className="doc-meta">
          {doc.category_name}
          {doc.subcategory_name ? ` › ${doc.subcategory_name}` : ""}
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

export default function DocumentGrid({
  documents,
  isAdmin,
  onDelete,
  onEdit,
  loading,
}) {
  if (loading) {
    return <p className="empty-state">Chargement des documents...</p>;
  }

  if (documents.length === 0) {
    return <p className="empty-state">Aucun document dans cette section.</p>;
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
