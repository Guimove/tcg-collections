import { CollectionDiff } from '../hooks/useCollectionDiff';

interface DiffBannerProps {
  diff: CollectionDiff;
  onDismiss: () => void;
}

export default function DiffBanner({ diff, onDismiss }: DiffBannerProps) {
  const hasChanges = diff.newCards.length > 0 || diff.removedCards.length > 0 ||
                     diff.increasedQty.length > 0 || diff.decreasedQty.length > 0;

  if (!hasChanges) return null;

  const parts: string[] = [];
  if (diff.newCards.length > 0) parts.push(`+${diff.newCards.length} nouvelle${diff.newCards.length > 1 ? 's' : ''}`);
  if (diff.increasedQty.length > 0) parts.push(`${diff.increasedQty.length} augmentée${diff.increasedQty.length > 1 ? 's' : ''}`);
  if (diff.decreasedQty.length > 0) parts.push(`${diff.decreasedQty.length} diminuée${diff.decreasedQty.length > 1 ? 's' : ''}`);
  if (diff.removedCards.length > 0) parts.push(`${diff.removedCards.length} retirée${diff.removedCards.length > 1 ? 's' : ''}`);

  const since = diff.lastUpdated
    ? `Depuis le ${diff.lastUpdated.toLocaleDateString('fr-FR')}`
    : 'Changements détectés';

  return (
    <div className="diff-banner">
      <div className="diff-banner-content">
        <span className="diff-banner-icon">+</span>
        <span className="diff-banner-text">
          {since} : {parts.join(', ')}
        </span>
      </div>
      <button className="diff-banner-close" onClick={onDismiss} title="Fermer">×</button>
    </div>
  );
}
