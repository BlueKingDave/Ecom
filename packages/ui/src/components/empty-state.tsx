import { LucideIcon } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionOnClick?: () => void;
  actionDisabled?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionOnClick,
  actionDisabled = false,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 max-w-md mx-auto">
      <Icon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-6">{description}</p>
      {actionLabel && actionOnClick && (
        <Button onClick={actionOnClick} size="lg" disabled={actionDisabled}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
