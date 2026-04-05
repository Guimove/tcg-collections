import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { useCollectionData } from '../hooks/useCollectionData';
import { parseCSVText } from '../utils/csvParser';
import { processCardCollection, getMarketplaceItems } from '../utils/algorithm';
import './StatsPage.css';

// Minimal card types for stats
interface BasicCard {
  name: string;
  quantity: number;
  rarity?: string;
  set?: string;
  color?: string;
}

// Reuse parse functions inline (simplified versions for stats only)
function parseAkiraForStats(rows: any[]): BasicCard[] {
  const cards: BasicCard[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 4) continue;
    const name = (row[0] || '').trim();
    const quantity = parseInt(row[3]) || 0;
    if (!name) continue;
    cards.push({ name, quantity, set: name }); // category as set
  }
  return cards;
}

function parseHeaderCSVForStats(rows: any[], nameField: string, qtyField: string, rarityField?: string, setField?: string, colorField?: string): BasicCard[] {
  return rows.filter(r => r[nameField]).map(r => ({
    name: (r[nameField] || '').trim(),
    quantity: parseInt(r[qtyField]) || 0,
    rarity: rarityField ? (r[rarityField] || '').trim() : undefined,
    set: setField ? (r[setField] || '').trim() : undefined,
    color: colorField ? (r[colorField] || '').trim() : undefined,
  }));
}

interface BarChartData {
  label: string;
  value: number;
  total: number;
}

function BarChart({ data, colorVar }: { data: BarChartData[]; colorVar?: string }) {
  const maxTotal = Math.max(...data.map(d => d.total), 1);
  return (
    <div className="bar-chart">
      {data.map(d => (
        <div key={d.label} className="bar-row">
          <span className="bar-label">{d.label}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${(d.value / maxTotal) * 100}%`,
                backgroundColor: colorVar,
              }}
            />
            <div
              className="bar-fill bar-fill-total"
              style={{ width: `${(d.total / maxTotal) * 100}%` }}
            />
          </div>
          <span className="bar-value">{d.value}/{d.total}</span>
        </div>
      ))}
    </div>
  );
}

function CompletionRing({ percent }: { percent: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg className="completion-ring" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={radius} className="ring-bg" />
      <circle cx="50" cy="50" r={radius} className="ring-fill"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
      <text x="50" y="50" className="ring-text">{Math.round(percent)}%</text>
    </svg>
  );
}

interface TCGStatsCardProps {
  name: string;
  slug: string;
  cards: BasicCard[];
  loading: boolean;
  accentColor: string;
  breakdownField?: 'rarity' | 'set' | 'color';
  forSaleOverride?: number;
}

function TCGStatsCard({ name, slug, cards, loading, accentColor, breakdownField, forSaleOverride }: TCGStatsCardProps) {
  const stats = useMemo(() => {
    const total = cards.length;
    const owned = cards.filter(c => c.quantity > 0).length;
    const totalQty = cards.reduce((s, c) => s + c.quantity, 0);
    const forSale = forSaleOverride ?? cards.reduce((s, c) => c.quantity >= 2 ? s + (c.quantity - 1) : s, 0);
    const completion = total > 0 ? (owned / total) * 100 : 0;
    return { total, owned, totalQty, forSale, completion };
  }, [cards, forSaleOverride]);

  const breakdown = useMemo(() => {
    if (!breakdownField) return [];
    const groups = new Map<string, { owned: number; total: number }>();
    for (const card of cards) {
      const key = card[breakdownField] || 'Unknown';
      if (!key) continue;
      const g = groups.get(key) || { owned: 0, total: 0 };
      g.total++;
      if (card.quantity > 0) g.owned++;
      groups.set(key, g);
    }
    return Array.from(groups.entries())
      .map(([label, { owned, total }]) => ({ label, value: owned, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10
  }, [cards, breakdownField]);

  if (loading) {
    return (
      <div className="stats-card">
        <h3 style={{ color: accentColor }}>{name}</h3>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="stats-card" style={{ borderColor: accentColor }}>
      <div className="stats-card-header">
        <div>
          <h3><Link to={`/${slug}`} style={{ color: accentColor }}>{name}</Link></h3>
          <div className="stats-card-numbers">
            <div className="stat-mini">
              <span className="stat-mini-value">{stats.total}</span>
              <span className="stat-mini-label">Total</span>
            </div>
            <div className="stat-mini">
              <span className="stat-mini-value">{stats.owned}</span>
              <span className="stat-mini-label">Possédées</span>
            </div>
            <div className="stat-mini">
              <span className="stat-mini-value">{stats.totalQty}</span>
              <span className="stat-mini-label">Exemplaires</span>
            </div>
            <div className="stat-mini">
              <span className="stat-mini-value">{stats.forSale}</span>
              <span className="stat-mini-label">À vendre</span>
            </div>
          </div>
        </div>
        <CompletionRing percent={stats.completion} />
      </div>
      {breakdown.length > 0 && (
        <div className="stats-card-breakdown">
          <h4>Par {breakdownField === 'rarity' ? 'rareté' : breakdownField === 'set' ? 'extension' : breakdownField === 'color' ? 'couleur' : breakdownField}</h4>
          <BarChart data={breakdown} colorVar={accentColor} />
        </div>
      )}
    </div>
  );
}

export default function StatsPage() {
  usePageTitle('Statistiques - Guimove');

  // Yu-Gi-Oh uses its own algorithm — load raw CSV and process with the real keep/sell logic
  const [yugiohData, setYugiohData] = useState<{ cards: BasicCard[]; forSale: number; loading: boolean }>({ cards: [], forSale: 0, loading: true });
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/yugioh/collection.csv');
        if (!response.ok) { setYugiohData(s => ({ ...s, loading: false })); return; }
        const text = await response.text();
        const result = parseCSVText(text);
        if (result.success && result.data) {
          const aggregated = processCardCollection(result.data);
          const marketplace = getMarketplaceItems(aggregated);
          const cards: BasicCard[] = aggregated.flatMap(c =>
            c.versions.map(v => ({
              name: `${c.cardName} [${v.Code}]`,
              quantity: v.Quantité,
              rarity: v.Rareté,
              set: v.Extension,
            }))
          );
          const forSale = marketplace.reduce((s, item) => s + item.toSell, 0);
          setYugiohData({ cards, forSale, loading: false });
        } else {
          setYugiohData(s => ({ ...s, loading: false }));
        }
      } catch {
        setYugiohData(s => ({ ...s, loading: false }));
      }
    })();
  }, []);

  const akira = useCollectionData('/akira/collection.csv', (rows) => parseAkiraForStats(rows), { header: false });
  const riftbound = useCollectionData('/riftbound/collection.csv', (rows) => parseHeaderCSVForStats(rows, 'name', 'quantity', 'rarity', 'set', 'color'), { transformHeader: h => h.trim() });
  const lorcana = useCollectionData('/lorcana/collection.csv', (rows) => parseHeaderCSVForStats(rows, 'NAME', 'QUANTITY', 'RARITY', 'SET', 'INK'), { transformHeader: h => h.trim() });
  const dreamcast = useCollectionData('/dreamcast/collection.csv', (rows) => rows.filter((r: any) => r.name).map((r: any) => ({
    name: r.name.trim(),
    quantity: (r.disc === '1' || r.manual === '1' || r.box === '1') ? 1 : 0,
    set: r.region?.trim(),
  })), { header: true, delimiter: ';' });

  // Grand totals — each entry carries its own forSale so Yu-Gi-Oh uses the algorithm result
  const allCollections = [
    { data: yugiohData.cards, loading: yugiohData.loading, forSale: yugiohData.forSale },
    { data: akira.data, loading: akira.loading, forSale: -1 },
    { data: riftbound.data, loading: riftbound.loading, forSale: -1 },
    { data: lorcana.data, loading: lorcana.loading, forSale: -1 },
    { data: dreamcast.data, loading: dreamcast.loading, forSale: -1 },
  ];

  const allLoaded = allCollections.every(c => !c.loading);
  const grandUnique = allLoaded ? allCollections.reduce((s, c) => s + c.data.length, 0) : 0;
  const grandOwned = allLoaded ? allCollections.reduce((s, c) => s + c.data.filter(card => card.quantity > 0).length, 0) : 0;
  const grandCopies = allLoaded ? allCollections.reduce((s, c) => s + c.data.reduce((ss, card) => ss + card.quantity, 0), 0) : 0;
  const grandForSale = allLoaded ? allCollections.reduce((s, c) => {
    if (c.forSale >= 0) return s + c.forSale;
    return s + c.data.reduce((ss, card) => card.quantity >= 2 ? ss + (card.quantity - 1) : ss, 0);
  }, 0) : 0;

  return (
    <div className="stats-page">
      <div className="stats-page-header">
        <Link to="/" className="back-button">← Accueil</Link>
        <h1>Statistiques des collections</h1>
        {allLoaded && (
          <div className="grand-totals">
            <div className="grand-stat">
              <span className="grand-value">{grandUnique}</span>
              <span className="grand-label">Total</span>
            </div>
            <div className="grand-stat">
              <span className="grand-value">{grandOwned}</span>
              <span className="grand-label">Possédées</span>
            </div>
            <div className="grand-stat">
              <span className="grand-value">{grandCopies}</span>
              <span className="grand-label">Exemplaires</span>
            </div>
            <div className="grand-stat">
              <span className="grand-value">{grandForSale}</span>
              <span className="grand-label">À vendre</span>
            </div>
            <div className="grand-stat">
              <span className="grand-value">{grandUnique > 0 ? Math.round((grandOwned / grandUnique) * 100) : 0}%</span>
              <span className="grand-label">Complétion</span>
            </div>
          </div>
        )}
      </div>

      <div className="stats-grid">
        <TCGStatsCard name="Yu-Gi-Oh!" slug="yugioh" cards={yugiohData.cards} loading={yugiohData.loading} accentColor="#ffd700" breakdownField="rarity" forSaleOverride={yugiohData.forSale} />
        <TCGStatsCard name="Dragon Ball Akira" slug="akira" cards={akira.data} loading={akira.loading} accentColor="#FF8C00" breakdownField="set" />
        <TCGStatsCard name="Riftbound" slug="riftbound" cards={riftbound.data} loading={riftbound.loading} accentColor="#0AC8B9" breakdownField="rarity" />
        <TCGStatsCard name="Lorcana" slug="lorcana" cards={lorcana.data} loading={lorcana.loading} accentColor="#8B5CF6" breakdownField="rarity" />
        <TCGStatsCard name="Dreamcast" slug="dreamcast" cards={dreamcast.data} loading={dreamcast.loading} accentColor="#0066CC" breakdownField="set" />
      </div>
    </div>
  );
}
