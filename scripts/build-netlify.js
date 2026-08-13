#!/usr/bin/env node
// Monta o diretorio de publicacao do Netlify (dist/) copiando SOMENTE os
// arquivos/pastas que compoem o site em producao (referenciados por
// index.html/styles.min.css/script.min.js), deixando de fora pastas de
// dev/historico (audit/, legado/, prototipos/, assets-fonte/, tests/,
// scripts/, docs/, node_modules/, etc.) que hoje vazam publicamente porque
// o Netlify publicava a raiz do repo sem filtro.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Arquivos na raiz e pastas inteiras que vao para o publish dir.
const FILES = ['index.html', '404.html', 'politica-de-privacidade.html', 'styles.min.css', 'script.min.js', '_headers', 'robots.txt', 'sitemap.xml'];
const DIRS = ['fonts', 'vendor', 'assets'];

// Arquivos dentro das DIRS acima que NAO devem ir para o dist/, mesmo a pasta
// pai sendo copiada por inteiro. Caminhos relativos a ROOT, separador '/'.
// Cada entrada documenta o motivo — nao apagar os arquivos fisicos do repo,
// so exclui-los do deploy publico.
const EXCLUDE = [
    // Lixo de editor commitado por engano dentro de assets/ (nao e asset do site).
    'assets/images/about/Perin_Rev-.code-workspace',
];

function toPosix(p) {
    return p.split(path.sep).join('/');
}

function copyRecursive(src, dest, relRoot) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src)) {
            copyRecursive(path.join(src, entry), path.join(dest, entry), relRoot);
        }
        return;
    }

    const relPath = toPosix(path.relative(ROOT, src));
    if (EXCLUDE.includes(relPath)) {
        excluded.push(relPath);
        return;
    }

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
}

const excluded = [];

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

for (const file of FILES) {
    const srcPath = path.join(ROOT, file);
    if (!fs.existsSync(srcPath)) {
        console.error(`[build-netlify] ERRO: arquivo de producao esperado nao encontrado: ${file}`);
        process.exit(1);
    }
    copyRecursive(srcPath, path.join(DIST, file));
}

for (const dir of DIRS) {
    const srcPath = path.join(ROOT, dir);
    if (!fs.existsSync(srcPath)) {
        console.error(`[build-netlify] ERRO: pasta de producao esperada nao encontrada: ${dir}/`);
        process.exit(1);
    }
    copyRecursive(srcPath, path.join(DIST, dir), dir);
}

console.log(`[build-netlify] OK — dist/ montado com ${FILES.length} arquivos + ${DIRS.length} pastas (${DIRS.join(', ')}).`);

if (excluded.length) {
    console.log(`[build-netlify] ${excluded.length} arquivo(s) mantido(s) no repo mas excluido(s) do dist/ (lista EXCLUDE):`);
    for (const rel of excluded) console.log(`  - ${rel}`);
} else {
    console.log('[build-netlify] Nenhum arquivo da lista EXCLUDE foi encontrado (nada a excluir nesta execucao).');
}

// Nota (auditoria 2026-07-21, audit/relatorio-arquivos-desnecessarios.md item 1):
// as 87 fotos orfas de assets/images/portfolio/ + variantes -desktop/-mobile de
// placeholder-obra-0X nao existem mais no repo (ja foram removidas em commit
// posterior ao relatorio) — reverificado nesta sessao, EXCLUDE nao precisa
// listar nada relativo a elas hoje. Se assets/images/portfolio/ ou variantes
// -desktop/-mobile.webp voltarem a existir sem uso em index.html/styles.css/
// script.js, adicione-as aqui antes de reativar o deploy.
