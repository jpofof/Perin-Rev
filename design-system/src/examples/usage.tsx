import React from 'react';
import { Badge, Button, Card } from '../index';

/** Exemplo de composição — não faz parte do bundle publicado, só referência. */
export function ExampleSection() {
    return (
        <section>
            <Badge>Sobre Nós</Badge>
            <h2>Engenharia que Constrói Confiança</h2>

            <Card variant="default">
                <p>Conteúdo institucional dentro de um card neutro.</p>
            </Card>

            <Card variant="stat" number="12+" label="Anos de atuação" />

            <Card variant="accent">
                <h3>Solicite seu orçamento</h3>
                <p>Equipe própria e acompanhamento em cada etapa.</p>
                <Button variant="glass" href="#contact">
                    Solicitar Orçamento
                </Button>
            </Card>

            <Button variant="solid" href="#contact">Enviar Mensagem</Button>
            <Button variant="outline" href="https://wa.me/5518997375322" external>
                Falar no WhatsApp
            </Button>
        </section>
    );
}
