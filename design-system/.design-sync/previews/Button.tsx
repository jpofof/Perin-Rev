import React from 'react';
import { Button } from '@perin/design-system';

export function Variants() {
    return (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant="solid" href="#contact">Solicitar Orçamento</Button>
            <Button variant="outline" href="#contact">Falar no WhatsApp</Button>
            <div style={{ background: '#0f2e1c', padding: 24, borderRadius: 8 }}>
                <Button variant="glass" href="#contact">Enviar Mensagem</Button>
            </div>
        </div>
    );
}

export function WithIcon() {
    return (
        <Button variant="solid" href="#contact" icon={<span aria-hidden="true">→</span>}>
            Solicitar Orçamento
        </Button>
    );
}

export function AsButtonElement() {
    return (
        <Button variant="solid" type="submit">
            Enviar Formulário
        </Button>
    );
}

export function ExternalLink() {
    return (
        <Button variant="outline" href="https://wa.me/5518997375322" external>
            Falar no WhatsApp
        </Button>
    );
}
