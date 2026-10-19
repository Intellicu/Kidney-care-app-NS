import React from 'react';
import { X } from 'lucide-react';
import { SEVERITY_CONFIG } from '@/lib/severitySystem';

const SeverityBadge = React.forwardRef(
  ({ severity, text, size = 'md', dismissible = false, onDismiss, onClick, icon, className = '' }, ref) => {
    const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.info;

    const sizeClasses = {
      sm: 'px-2 py-1 text-sm gap-1',
      md: 'px-3 py-2 text-base gap-2',
      lg: 'px-4 py-3 text-lg gap-3',
    };

    return (
      <div
        ref={ref}
        className={`flex items-center gap-2 rounded-lg border-l-4 transition-all duration-200 ${sizeClasses[size]} ${className}`}
        style={{
          backgroundColor: config.bgColor,
          borderLeftColor: config.borderColor,
          color: config.textColor,
          ...(onClick && { cursor: 'pointer' }),
        }}
        onClick={onClick}
      >
        {icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : (
          <span className="flex-shrink-0 text-lg">{config.icon}</span>
        )}

        <span className="flex-1 font-semibold">{text}</span>

        {dismissible && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss?.();
            }}
            className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);

SeverityBadge.displayName = 'SeverityBadge';

export default SeverityBadge;
