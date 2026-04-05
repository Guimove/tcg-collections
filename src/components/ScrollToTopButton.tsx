interface ScrollToTopButtonProps {
  visible: boolean;
  onClick: () => void;
}

export default function ScrollToTopButton({ visible, onClick }: ScrollToTopButtonProps) {
  if (!visible) return null;
  return (
    <button className="scroll-to-top" onClick={onClick} title="Retour en haut">
      ↑
    </button>
  );
}
