import React from 'react';
import './Badge.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    children: React.ReactNode;
}

/**
 * Badge/eyebrow do Design System Perin — extraído de `.section-tag`,
 * usado acima de títulos de seção ("Sobre Nós", "Clientes", "Contato"...).
 */
export function Badge({ className, children, ...rest }: BadgeProps) {
    return (
        <span className={['pds-badge', className].filter(Boolean).join(' ')} {...rest}>
            {children}
        </span>
    );
}
