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

/**
 * Télécharge un fichier distant en forçant le téléchargement
 * (évite l'ouverture dans un nouvel onglet, même si le fichier
 * provient d'une origine différente).
 */
async function downloadFile(url, filename) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Réponse réseau invalide");
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename || "document.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    // Repli si le fetch échoue (ex. CORS) : ouverture directe du fichier
    console.error("Échec du téléchargement, ouverture directe :", err);
    window.open(url, "_blank", "noreferrer");
  }
}

/**
 * Rend toutes les pages d'un PDF en images, et détecte l'orientation
 * dominante (portrait ou paysage) du document.
 */
async function buildPrintPages(url) {
  const pdf = await pdfjsLib.getDocument(url).promise;
  const pages = [];
  let landscapeCount = 0;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    // scale 2 = bonne qualité d'impression sans être trop lourd
    const viewport = page.getViewport({ scale: 2 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({
      canvasContext: canvas.getContext("2d"),
      viewport,
    }).promise;

    const isLandscape = viewport.width > viewport.height;
    if (isLandscape) landscapeCount += 1;

    pages.push({ dataUrl: canvas.toDataURL("image/png"), isLandscape });
  }

  const orientation =
    landscapeCount > pdf.numPages / 2 ? "landscape" : "portrait";

  return { pages, orientation };
}

/**
 * Ouvre le tableau d'impression natif du navigateur (équivalent Ctrl+P)
 * en imprimant chaque page du PDF en tant qu'image, avec une règle
 * @page dont l'orientation correspond au document. Cela évite le
 * dépassement du format A4 lorsque le PDF est en paysage : on ne dépend
 * plus du visualiseur PDF natif du navigateur, qui imprime par défaut
 * en portrait quelle que soit l'orientation réelle du fichier.
 */
async function printFile(url) {
  let container;
  let styleEl;

  try {
    const { pages, orientation } = await buildPrintPages(url);

    container = document.createElement("div");
    container.className = "print-pdf-container";

    const imgLoadPromises = [];

    pages.forEach(({ dataUrl }) => {
      const pageDiv = document.createElement("div");
      pageDiv.className = "print-pdf-page";
      const img = document.createElement("img");
      img.src = dataUrl;

      const loadPromise = new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      imgLoadPromises.push(loadPromise);

      pageDiv.appendChild(img);
      container.appendChild(pageDiv);
    });

    document.body.appendChild(container);

    styleEl = document.createElement("style");
    styleEl.textContent = `@page { size: ${orientation}; margin: 0; }`;
    document.head.appendChild(styleEl);

    document.body.classList.add("printing-pdf-doc");

    // Attend que toutes les images soient réellement chargées/décodées
    // dans le DOM, sinon le premier appel à window.print() peut afficher
    // un aperçu vide ou obsolète (nécessitant de fermer/rouvrir la boîte
    // de dialogue pour voir le contenu).
    await Promise.all(imgLoadPromises);

    // Force un cycle de rendu complet avant d'imprimer
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );

    const cleanup = () => {
      document.body.classList.remove("printing-pdf-doc");
      if (container && container.parentNode)
        document.body.removeChild(container);
      if (styleEl && styleEl.parentNode) document.head.removeChild(styleEl);
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);
    // Filet de sécurité si "afterprint" n'est pas déclenché (certains navigateurs/contextes)
    setTimeout(cleanup, 120000);

    window.print();
  } catch (err) {
    console.error("Échec de la préparation de l'impression :", err);
    if (container && container.parentNode) document.body.removeChild(container);
    if (styleEl && styleEl.parentNode) document.head.removeChild(styleEl);
    document.body.classList.remove("printing-pdf-doc");
    window.open(url, "_blank", "noreferrer");
  }
}

function DocumentCard({ doc, isAdmin, onDelete, onEdit }) {
  const categoryLabel = [doc.category_name, doc.subcategory_name]
    .filter(Boolean)
    .join(" › ");

  const handleDownload = (e) => {
    e.preventDefault();
    const filename = doc.title ? `${doc.title}.pdf` : undefined;
    downloadFile(doc.file_url, filename);
  };

  const handlePrint = (e) => {
    e.preventDefault();
    printFile(doc.file_url);
  };
  // Note : printFile est asynchrone (récupération du blob avant impression),
  // mais on n'a pas besoin d'attendre son résultat ici.

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
        <div className="doc-footer-actions">
          <button
            className="btn-icon btn-icon--download"
            onClick={handleDownload}
            title="Télécharger"
            aria-label="Télécharger le document"
          >
            ⬇️
          </button>
          <button
            className="btn-icon btn-icon--print"
            onClick={handlePrint}
            title="Imprimer"
            aria-label="Imprimer le document"
          >
            🖨️
          </button>
          {isAdmin && (
            <>
              <button
                className="btn-icon btn-icon--edit"
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
