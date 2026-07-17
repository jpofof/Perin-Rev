#!/usr/bin/env node
// Instala os git hooks versionados em scripts/git-hooks/ dentro de .git/hooks/.
// Roda automaticamente via "prepare" (npm install) para que qualquer clone novo
// ganhe a trava de .min desatualizado sem passo manual.
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

let commonDir;
try {
    // --git-common-dir (nao --git-dir): em worktrees, hooks vivem no dir git
    // compartilhado do repo principal, nao no dir administrativo do worktree
    // (.git/worktrees/<nome>/) — usar --git-dir instala num lugar que o git
    // nunca olha, e o hook nunca dispara.
    commonDir = execSync('git rev-parse --git-common-dir', { cwd: ROOT }).toString().trim();
} catch {
    process.exit(0); // nao e um repo git (ex: instalado como dependencia) — silencioso
}

const hooksSrcDir = path.join(ROOT, 'scripts', 'git-hooks');
const hooksDestDir = path.isAbsolute(commonDir) ? path.join(commonDir, 'hooks') : path.join(ROOT, commonDir, 'hooks');

if (!fs.existsSync(hooksSrcDir)) process.exit(0);
fs.mkdirSync(hooksDestDir, { recursive: true });

for (const hookName of fs.readdirSync(hooksSrcDir)) {
    const src = path.join(hooksSrcDir, hookName);
    const dest = path.join(hooksDestDir, hookName);
    fs.copyFileSync(src, dest);
    fs.chmodSync(dest, 0o755);
    console.log(`[install-git-hooks] ${hookName} instalado em ${dest}`);
}
