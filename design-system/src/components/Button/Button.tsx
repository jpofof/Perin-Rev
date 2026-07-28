import React from 'react';
import './Button.css';

export type ButtonVariant = 'solid' | 'glass' | 'outline';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Estilo visual do botão. "solid" = verde sólido, "glass" = fluid glass (sobre fundo escuro), "outline" = contorno (sobre fundo claro). */
    variant?: ButtonVariant;
    /** Se definido, renderiza um `<a>` em vez de `<button>`. */
    href?: string;
    /** Abre o link em nova aba (só tem efeito com `href`). */
    external?: boolean;
    /** Ícone opcional exibido após o texto (ex: seta). */
    icon?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Botão do Design System Perin.
 *
 * Extraído de três padrões reais do site: `.nav-link-highlight`/
 * `.form-submit-button` (variant="solid"), `.hero-button-secondary`
 * (variant="glass"), `.cta-principal-btn-secundario` (variant="outline").
 */
export function Button({
    variant = 'solid',
    href,
    external,
    icon,
    className,
    children,
    ...rest
}: ButtonProps) {
    const classes = ['pds-button', `pds-button--${variant}`, className].filter(Boolean).join(' ');

    if (href) {
        return (
            <a
                href={href}
                className={classes}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
            >
                {children}
                {icon && <span className="pds-button__icon">{icon}</span>}
            </a>
        );
    }

    return (
        <button className={classes} {...rest}>
            {children}
            {icon && <span className="pds-button__icon">{icon}</span>}
        </button>
    );
}
