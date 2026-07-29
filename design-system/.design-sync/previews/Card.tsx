import React from 'react';
import { Card, Button } from '@perin/design-system';

export function Default() {
    return (
        <Card variant="default">
            <p>Conteúdo institucional dentro de um card neutro, extraído do frame de imagem "Sobre Nós".</p>
        </Card>
    );
}

export function Stat() {
    return (
        <div style={{ display: 'flex', gap: 16 }}>
            <Card variant="stat" number="12+" label="Anos de atuação" />
            <Card variant="stat" number="500+" label="Obras entregues" />
            <Card variant="stat" number="98%" label="Clientes satisfeitos" />
        </div>
    );
}

export function Accent() {
    return (
        <Card variant="accent">
            <h3>Solicite seu orçamento</h3>
            <p>Equipe própria e acompanhamento em cada etapa da obra.</p>
            <Button variant="glass" href="#contact">Solicitar Orçamento</Button>
        </Card>
    );
}
