import React from 'react';

const Card = ({ children, title, footer, className = '', ...props }) => {
  return (
    <div className={`admin-card overflow-hidden ${className}`} {...props}>
      {title && (
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800">{title}</h3>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
      {footer && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
