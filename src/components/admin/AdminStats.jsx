// src/components/admin/AdminStats.jsx
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./AdminStats.css";

// Icônes SVG inline
const IconArrowUp = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path
      d="M12 19V5M5 12l7-7 7 7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconArrowDown = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path
      d="M12 5v14M5 12l7 7 7-7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function AdminStats({ onClose }) {
  const [period, setPeriod] = useState("week"); // 'day' | 'week' | 'month' | 'year'
  const [stats, setStats] = useState([]);
  const [totals, setTotals] = useState({
    totalVisits: 0,
    todayVisits: 0,
    averagePerDay: 0,
    trend: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Réinitialisation des stats
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  // Périodes disponibles
  const periods = [
    { value: "day", label: "Jour" },
    { value: "week", label: "Semaine" },
    { value: "month", label: "Mois" },
    { value: "year", label: "Année" },
  ];

  useEffect(() => {
    fetchStats();
  }, [period]);

  async function fetchStats() {
    setLoading(true);
    setError("");
    try {
      const now = new Date();
      let startDate = new Date();

      // Définir la date de début selon la période
      switch (period) {
        case "day":
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
      }

      // Formater pour Supabase
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = now.toISOString().split("T")[0];

      // Récupérer les visites
      const { data, error } = await supabase
        .from("visits")
        .select("visit_date, created_at")
        .gte("visit_date", startDateStr)
        .lte("visit_date", endDateStr)
        .order("visit_date", { ascending: true });

      if (error) throw error;

      // Agrégation
      const aggregated = aggregateStats(data || [], period);
      setStats(aggregated);

      // Calcul des totaux
      const totalVisits = data?.length || 0;
      const todayVisits =
        data?.filter((v) => v.visit_date === now.toISOString().split("T")[0])
          .length || 0;

      // Calcul de la moyenne
      const daysDiff = Math.max(
        1,
        Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)),
      );
      const averagePerDay = totalVisits / daysDiff;

      // Calcul de la tendance (comparaison avec la période précédente)
      const previousStart = new Date(startDate);
      previousStart.setDate(previousStart.getDate() - daysDiff);
      const previousStartStr = previousStart.toISOString().split("T")[0];

      const { data: previousData } = await supabase
        .from("visits")
        .select("visit_date")
        .gte("visit_date", previousStartStr)
        .lt("visit_date", startDateStr);

      const previousVisits = previousData?.length || 0;
      const trend =
        previousVisits > 0
          ? ((totalVisits - previousVisits) / previousVisits) * 100
          : totalVisits > 0
            ? 100
            : 0;

      setTotals({
        totalVisits,
        todayVisits,
        averagePerDay: Math.round(averagePerDay * 10) / 10,
        trend: Math.round(trend * 10) / 10,
      });
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  }

  function aggregateStats(data, period) {
    const map = {};

    data.forEach((item) => {
      const date = item.visit_date;
      if (!map[date]) map[date] = 0;
      map[date] += 1;
    });

    // Trier les dates
    const sortedDates = Object.keys(map).sort();

    // Formater selon la période
    const formatDate = (dateStr) => {
      const d = new Date(dateStr + "T00:00:00");
      switch (period) {
        case "day":
          return d.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          });
        case "week":
          return d.toLocaleDateString("fr-FR", {
            weekday: "short",
            day: "numeric",
          });
        case "month":
          return d.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          });
        case "year":
          return d.toLocaleDateString("fr-FR", {
            month: "short",
            year: "numeric",
          });
        default:
          return d.toLocaleDateString("fr-FR");
      }
    };

    return sortedDates.map((date) => ({
      date: formatDate(date),
      count: map[date],
      fullDate: date,
    }));
  }

  // Trouver le max pour l'échelle du graphique
  const maxCount = useMemo(() => {
    if (stats.length === 0) return 10;
    return Math.max(...stats.map((s) => s.count)) * 1.2;
  }, [stats]);

  // Calcul du total des visites pour la période affichée
  const totalVisitsPeriod = stats.reduce((sum, s) => sum + s.count, 0);

  // Réinitialiser toutes les statistiques (supprime toutes les lignes de "visits")
  async function handleResetStats() {
    setResetting(true);
    setResetError("");
    try {
      // Supabase exige une clause de filtre pour delete : on cible toutes les lignes
      // dont l'id n'est pas un UUID nul (donc toutes les lignes existantes).
      const { error } = await supabase
        .from("visits")
        .delete()
        .gte("visit_date", "1970-01-01");

      if (error) throw error;

      setShowResetConfirm(false);
      await fetchStats();
    } catch (err) {
      setResetError(
        err.message || "Erreur lors de la réinitialisation des statistiques",
      );
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="stats-overlay" onClick={onClose}>
      <div className="stats-card" onClick={(e) => e.stopPropagation()}>
        <div className="stats-header">
          <h2>📊 Statistiques des connexions</h2>
          <div className="stats-header-actions">
            <button
              className="stats-reset-btn"
              onClick={() => setShowResetConfirm(true)}
              disabled={loading}
            >
              Réinitialiser
            </button>
            <button className="stats-close-btn" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="stats-body">
          {/* Sélecteur de période */}
          <div className="stats-period-selector">
            {periods.map((p) => (
              <button
                key={p.value}
                className={`stats-period-btn ${period === p.value ? "active" : ""}`}
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Indicateurs rapides */}
          <div className="stats-quick-metrics">
            <div className="stats-metric">
              <span className="stats-metric-label">Total connexions</span>
              <span className="stats-metric-value">{totals.totalVisits}</span>
            </div>
            <div className="stats-metric">
              <span className="stats-metric-label">Aujourd'hui</span>
              <span className="stats-metric-value">{totals.todayVisits}</span>
            </div>
            <div className="stats-metric">
              <span className="stats-metric-label">Moyenne/jour</span>
              <span className="stats-metric-value">{totals.averagePerDay}</span>
            </div>
            <div className="stats-metric">
              <span className="stats-metric-label">Tendance</span>
              <span
                className={`stats-metric-value ${totals.trend >= 0 ? "positive" : "negative"}`}
              >
                {totals.trend >= 0 ? "↑" : "↓"} {Math.abs(totals.trend)}%
              </span>
            </div>
          </div>

          {/* Graphique */}
          <div className="stats-chart-container">
            {loading ? (
              <div className="stats-loading">
                <span className="stats-spinner"></span>
                <span>Chargement des statistiques...</span>
              </div>
            ) : error ? (
              <div className="stats-error">{error}</div>
            ) : stats.length === 0 ? (
              <div className="stats-empty">
                <span>📭</span>
                <p>Aucune donnée pour cette période</p>
              </div>
            ) : (
              <div className="stats-chart">
                {stats.map((item, index) => {
                  const height =
                    maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                  const isToday =
                    item.fullDate === new Date().toISOString().split("T")[0];

                  return (
                    <div key={index} className="stats-bar-group">
                      <div className="stats-bar-wrapper">
                        <div
                          className={`stats-bar ${isToday ? "today" : ""}`}
                          style={{ height: `${Math.max(4, height)}%` }}
                          title={`${item.date}: ${item.count} connexion${item.count > 1 ? "s" : ""}`}
                        >
                          <span className="stats-bar-tooltip">
                            {item.count}
                          </span>
                        </div>
                      </div>
                      <span className="stats-bar-label">{item.date}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Petit résumé */}
          {!loading && !error && stats.length > 0 && (
            <div className="stats-summary">
              <p>
                <strong>{totalVisitsPeriod}</strong> connexion
                {totalVisitsPeriod > 1 ? "s" : ""} sur la période
                {period === "day" && " (aujourd'hui)"}
                {period === "week" && " (7 derniers jours)"}
                {period === "month" && " (30 derniers jours)"}
                {period === "year" && " (12 derniers mois)"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmation de réinitialisation */}
      {showResetConfirm && (
        <div
          className="stats-reset-confirm-overlay"
          onClick={() => !resetting && setShowResetConfirm(false)}
        >
          <div
            className="stats-reset-confirm-card"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="stats-reset-confirm-icon">⚠️</span>
            <h3>Réinitialiser les statistiques ?</h3>
            <p>
              Cette action va supprimer <strong>définitivement</strong> toutes
              les connexions enregistrées.
            </p>
            <p className="stats-reset-confirm-warning">
              Cette action est irréversible.
            </p>
            {resetError && <p className="stats-error">{resetError}</p>}
            <div className="stats-reset-confirm-actions">
              <button
                className="stats-reset-confirm-cancel"
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
              >
                Annuler
              </button>
              <button
                className="stats-reset-confirm-danger"
                onClick={handleResetStats}
                disabled={resetting}
              >
                {resetting ? "Suppression..." : "Oui, tout réinitialiser"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
