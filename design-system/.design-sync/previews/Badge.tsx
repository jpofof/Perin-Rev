import React from 'react';
import { Badge } from '@perin/design-system';

export function Default() {
    return <Badge>Sobre Nós</Badge>;
}

export function Variants() {
    return (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Badge>Sobre Nós</Badge>
            <Badge>Clientes</Badge>
            <Badge>Contato</Badge>
        </div>
    );
}
