#!/usr/bin/env node
// Trava contra o bug "commitei script.js/styles.css mas esqueci de regenerar
// o .min correspondente" (ja aconteceu 4x nesta sessao: 1x CSS, 2x JS).
// Compara CONTEUDO (regenera em memoria e faz diff), nao timestamp — git
// nao preserva mtimes de forma confiavel entre checkouts/clones.
//
// Usa as APIs JS de terser/clean-css diretamente (nao subprocess via npx):
// invocar `npx <cli>` com shell:true quebra quando o caminho do projeto tem
// espacos (ex: "Área de Trabalho"), pois os argumentos nao ficam quotados.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

async function checkJs() {
    const srcPath = path.join(ROOT, 'script.js');
    const minPath = path.join(ROOT, 'script.min.js');
    if (!fs.existsSync(srcPath) || !fs.existsSync(minPath)) return true;

    const { minify } = require('terser');
    const src = fs.readFileSync(srcPath, 'utf8');
    const result = await minify(src, { compress: true, mangle: true });
    if (result.error) {
        console.error('[check-min-freshness] Falha ao minificar script.js para comparacao:', result.error.message);
        process.exit(1);
    }

    const current = fs.readFileSync(minPath, 'utf8');
    if (current !== result.code) {
        console.error('\n[check-min-freshness] ERRO: script.js foi modificado mas script.min.js nao foi regenerado.');
        console.error('  Rode: npx terser script.js -o script.min.js -c -m');
        console.error('  Depois adicione script.min.js ao commit.\n');
        return false;
    }
    return true;
}

function checkCss() {
    const srcPath = path.join(ROOT, 'styles.css');
    const minPath = path.join(ROOT, 'styles.min.css');
    if (!fs.existsSync(srcPath) || !fs.existsSync(minPath)) return true;

    const CleanCSS = require('clean-css');
    const src = fs.readFileSync(srcPath, 'utf8');
    const result = new CleanCSS({}).minify(src);
    if (result.errors && result.errors.length) {
        console.error('[check-min-freshness] Falha ao minificar styles.css para comparacao:', result.errors);
        process.exit(1);
    }

    const current = fs.readFileSync(minPath, 'utf8');
    if (current !== result.styles) {
        console.error('\n[check-min-freshness] ERRO: styles.css foi modificado mas styles.min.css nao foi regenerado.');
        console.error('  Rode: npx clean-css-cli styles.css -o styles.min.css');
        console.error('  Depois adicione styles.min.css ao commit.\n');
        return false;
    }
    return true;
}

(async () => {
    const jsOk = await checkJs();
    const cssOk = checkCss();

    if (!jsOk || !cssOk) process.exit(1);

    console.log('[check-min-freshness] OK — script.min.js e styles.min.css refletem os fontes atuais.');
    process.exit(0);
})();
