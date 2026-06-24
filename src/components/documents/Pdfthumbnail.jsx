import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import "./Pdfthumbnail.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Cache mémoire pour éviter de re-générer la même miniature
// si la card se re-render (changement de filtre, etc.)
const thumbnailCache = new Map();

export default function PdfThumbnail({ url, alt }) {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | done | error

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!url) {
        setStatus("error");
        return;
      }

      // Si déjà en cache, on dessine directement
      if (thumbnailCache.has(url)) {
        const dataUrl = thumbnailCache.get(url);
        drawFromDataUrl(dataUrl);
        return;
      }

      try {
        setStatus("loading");
        const pdf = await pdfjsLib.getDocument(url).promise;
        const page = await pdf.getPage(1);

        // On rend à une résolution un peu plus haute que l'affichage
        // final pour rester net sur écrans retina, puis CSS réduit la taille.
        const targetWidth = 400;
        const viewport = page.getViewport({ scale: 1 });
        const scale = targetWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        const ctx = canvas.getContext("2d");

        await page.render({ canvasContext: ctx, viewport: scaledViewport })
          .promise;

        if (cancelled) return;

        const dataUrl = canvas.toDataURL("image/png");
        thumbnailCache.set(url, dataUrl);
        drawFromDataUrl(dataUrl);
      } catch (err) {
        console.error("Erreur génération miniature PDF :", err);
        if (!cancelled) setStatus("error");
      }
    }

    function drawFromDataUrl(dataUrl) {
      if (cancelled || !canvasRef.current) return;
      canvasRef.current.src = dataUrl;
      setStatus("done");
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="pdf-thumb-wrap">
      {status === "loading" && (
        <div className="pdf-thumb-placeholder">
          <span className="pdf-thumb-spinner" />
        </div>
      )}
      {status === "error" && (
        <div className="pdf-thumb-placeholder pdf-thumb-fallback">
          <span className="pdf-thumb-icon">PDF</span>
        </div>
      )}
      <img
        ref={canvasRef}
        alt={alt}
        className="pdf-thumb-img"
        style={{ display: status === "done" ? "block" : "none" }}
      />
    </div>
  );
}
