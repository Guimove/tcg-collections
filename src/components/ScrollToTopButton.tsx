import Icon from './Icon';

interface ScrollToTopButtonProps {
  visible: boolean;
  onClick: () => void;
}

export default function ScrollToTopButton({ visible, onClick }: ScrollToTopButtonProps) {
  if (!visible) return null;
  return (
    <button className="scroll-to-top" onClick={onClick} aria-label="Retour en haut" title="Retour en haut">
      <Icon name="arrow-up" size={22} />
    </button>
  );
}
