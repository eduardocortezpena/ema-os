import React, { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-900 border border-gray-800 rounded-xl">
      {icon && (
        <div className="mb-4 text-gray-400 bg-gray-800 p-3 rounded-full">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-gray-100">{title}</h3>
      <p className="mb-6 text-sm text-gray-400 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
