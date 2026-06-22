import Icon, { type IconName } from './Icon';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message: string;
}

export default function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon name={icon} size={28} />
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
