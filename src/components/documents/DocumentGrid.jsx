import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import "./DocumentGrid.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const thumbnailCache = new Map();

// ── Favoris (localStorage) ──────────────────────────────────────────────────

const FAVORITES_KEY = "doc_favorites";

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveFavorites(set) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set]));
  } catch {
    // silently ignore quota errors
  }
}

// ── Hook partagé ────────────────────────────────────────────────────────────

function useFavorites() {
  const [favorites, setFavorites] = useState(() => loadFavorites());

  const toggle = useCallback((docId) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      saveFavorites(next);
      return next;
    });
  }, []);

  return { favorites, toggle };
}

// ── Miniature PDF ────────────────────────────────────────────────────────────

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

// ── Utilitaires ──────────────────────────────────────────────────────────────

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// Marge pour ignorer le décalage naturel (ms) entre created_at et updated_at
// à la création d'un document (les deux sont posés par défaut à `now()`).
const EDIT_THRESHOLD_MS = 5000;

/**
 * Détermine le badge à afficher pour un document :
 * - "updated" si le document a été modifié après sa création, récemment
 * - "new" si le document a simplement été créé récemment (jamais modifié)
 * - null sinon
 */
function getRecencyBadge(doc) {
  const createdTime = new Date(doc.created_at).getTime();
  const updatedTime = doc.updated_at
    ? new Date(doc.updated_at).getTime()
    : createdTime;
  const now = Date.now();

  const wasEdited = updatedTime - createdTime > EDIT_THRESHOLD_MS;

  if (wasEdited) {
    return now - updatedTime < WEEK_MS ? "updated" : null;
  }
  return now - createdTime < WEEK_MS ? "new" : null;
}

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
    console.error("Échec du téléchargement, ouverture directe :", err);
    window.open(url, "_blank", "noreferrer");
  }
}

async function buildPrintPages(url) {
  const pdf = await pdfjsLib.getDocument(url).promise;
  const pages = [];
  let landscapeCount = 0;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport })
      .promise;

    const isLandscape = viewport.width > viewport.height;
    if (isLandscape) landscapeCount += 1;
    pages.push({ dataUrl: canvas.toDataURL("image/png"), isLandscape });
  }

  const orientation =
    landscapeCount > pdf.numPages / 2 ? "landscape" : "portrait";
  return { pages, orientation };
}

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

    await Promise.all(imgLoadPromises);
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );

    const cleanup = () => {
      document.body.classList.remove("printing-pdf-doc");
      if (container?.parentNode) document.body.removeChild(container);
      if (styleEl?.parentNode) document.head.removeChild(styleEl);
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);
    setTimeout(cleanup, 120000);
    window.print();
  } catch (err) {
    console.error("Échec de la préparation de l'impression :", err);
    if (container?.parentNode) document.body.removeChild(container);
    if (styleEl?.parentNode) document.head.removeChild(styleEl);
    document.body.classList.remove("printing-pdf-doc");
    window.open(url, "_blank", "noreferrer");
  }
}

// ── Carte document ───────────────────────────────────────────────────────────

function DocumentCard({
  doc,
  isAdmin,
  onDelete,
  onEdit,
  isFavorite,
  onToggleFavorite,
}) {
  const categoryLabel = [doc.category_name, doc.subcategory_name]
    .filter(Boolean)
    .join(" › ");

  const badge = getRecencyBadge(doc);

  const handleDownload = (e) => {
    e.preventDefault();
    const filename = doc.title ? `${doc.title}.pdf` : undefined;
    downloadFile(doc.file_url, filename);
  };

  const handlePrint = (e) => {
    e.preventDefault();
    printFile(doc.file_url);
  };

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(doc.id);
  };

  return (
    <div className={`doc-card${isFavorite ? " doc-card--favorite" : ""}`}>
      {/* Bouton favori */}
      <button
        className={`btn-favorite${isFavorite ? " btn-favorite--active" : ""}`}
        onClick={handleFavorite}
        title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-pressed={isFavorite}
      >
        {isFavorite ? "❤️" : "🤍"}
      </button>

      <a
        href={doc.file_url}
        target="_blank"
        rel="noreferrer"
        className="doc-thumb-link"
      >
        {badge === "new" && (
          <span className="badge-new" aria-label="Nouveau document">
            Nouveau
          </span>
        )}
        {badge === "updated" && (
          <span className="badge-new" aria-label="Document mis à jour">
            Mise à jour
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
          {new Date(doc.updated_at || doc.created_at).toLocaleDateString(
            "fr-FR",
            {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            },
          )}
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

// ── En-tête de section ───────────────────────────────────────────────────────

function SectionHeader({ icon, title, count }) {
  return (
    <div className="section-header">
      <div className="section-icon">{icon}</div>
      <span className="section-title">{title}</span>
      {count != null && <span className="section-count">{count}</span>}
    </div>
  );
}

// ── Grille de cartes ─────────────────────────────────────────────────────────

function DocGrid({
  docs,
  isAdmin,
  onDelete,
  onEdit,
  favorites,
  onToggleFavorite,
}) {
  return (
    <div className="doc-grid">
      {docs.map((doc) => (
        <DocumentCard
          key={doc.id}
          doc={doc}
          isAdmin={isAdmin}
          onDelete={onDelete}
          onEdit={onEdit}
          isFavorite={favorites.has(doc.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────

export default function DocumentGrid({
  documents,
  isAdmin,
  onDelete,
  onEdit,
  loading,
  mode,
}) {
  const { favorites, toggle } = useFavorites();

  const favoriteDocs = documents.filter((d) => favorites.has(d.id));

  // ── Mode accueil ──
  if (mode === "home") {
    const recent = documents.filter((d) => getRecencyBadge(d) !== null);

    return (
      <div className="doc-layout">
        {/* Section Favoris */}
        {favoriteDocs.length > 0 && (
          <section className="doc-section">
            <SectionHeader
              icon="★"
              title="Favoris"
              count={favoriteDocs.length}
            />
            <DocGrid
              docs={favoriteDocs}
              isAdmin={isAdmin}
              onDelete={onDelete}
              onEdit={onEdit}
              favorites={favorites}
              onToggleFavorite={toggle}
            />
          </section>
        )}

        {/* Section Nouveautés */}
        <section className="doc-section">
          <SectionHeader icon="✨" title="Nouveautés" count={recent.length} />
          {recent.length === 0 ? (
            <p className="doc-empty">
              Aucune nouveauté cette semaine — revenez bientôt&nbsp;!
            </p>
          ) : (
            <DocGrid
              docs={recent}
              isAdmin={isAdmin}
              onDelete={onDelete}
              onEdit={onEdit}
              favorites={favorites}
              onToggleFavorite={toggle}
            />
          )}
        </section>
      </div>
    );
  }

  // ── Mode liste/catégorie ──
  if (documents.length === 0)
    return <p className="doc-empty">Aucun document dans cette section.</p>;

  return (
    <div className="doc-layout">
      {/* Section Favoris (dans la section courante seulement) */}
      {favoriteDocs.length > 0 && (
        <section className="doc-section">
          <SectionHeader icon="★" title="Favoris" count={favoriteDocs.length} />
          <DocGrid
            docs={favoriteDocs}
            isAdmin={isAdmin}
            onDelete={onDelete}
            onEdit={onEdit}
            favorites={favorites}
            onToggleFavorite={toggle}
          />
        </section>
      )}

      <section className="doc-section">
        <SectionHeader
          icon="📁"
          title="Tous les documents"
          count={documents.length}
        />
        <DocGrid
          docs={documents}
          isAdmin={isAdmin}
          onDelete={onDelete}
          onEdit={onEdit}
          favorites={favorites}
          onToggleFavorite={toggle}
        />
      </section>
    </div>
  );
}
