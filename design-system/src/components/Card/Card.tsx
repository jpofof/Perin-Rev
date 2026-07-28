import React from 'react';
import './Card.css';

export type CardVariant = 'default' | 'stat' | 'accent';

interface BaseCardProps {
    variant?: CardVariant;
    className?: string;
}

export interface CardProps extends BaseCardProps, React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'accent';
    children: React.ReactNode;
}

export interface StatCardProps extends BaseCardProps {
    variant: 'stat';
    /** Número/valor em destaque (ex: "12", "500+"). Use "—" para placeholder de dado aguardando. */
    number: React.ReactNode;
    /** Rótulo descritivo abaixo do número. */
    label: string;
}

/**
 * Card do Design System Perin.
 *
 * variant="default": card de conteúdo neutro (`.about-image-frame`).
 * variant="stat": número + rótulo centralizados (`.stat-card`) — use com `number`/`label`.
 * variant="accent": fundo verde sólido, texto claro (`.hero-contact-card`).
 */
export function Card(props: CardProps | StatCardProps) {
    if (props.variant === 'stat') {
        const { number, label, className } = props;
        return (
            <div className={['pds-card', 'pds-card--stat', className].filter(Boolean).join(' ')}>
                <span className="pds-card__stat-number">{number}</span>
                <span className="pds-card__stat-label">{label}</span>
            </div>
        );
    }

    const { variant = 'default', className, children, ...rest } = props;
    return (
        <div className={['pds-card', `pds-card--${variant}`, className].filter(Boolean).join(' ')} {...rest}>
            {children}
        </div>
    );
}
