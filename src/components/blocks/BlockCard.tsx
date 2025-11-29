import { PropsWithChildren, ReactNode } from 'react';
import './BlockCard.css';

interface Props extends PropsWithChildren {
  title: string;
  icon?: ReactNode;
}

export function BlockCard({ title, icon, children }: Props) {
  return (
    <div className="block-card">
      <div className="block-card__header">
        <div className="block-card__title">
          {icon}
          <span>{title}</span>
        </div>
      </div>
      <div className="block-card__body">{children}</div>
    </div>
  );
}
