/**
 * Unit Tests — scripts/build-netlify.js (cache busting)
 *
 * Runs the real build script against the actual repo files and validates
 * that dist/index.html references script.min.js/styles.min.css with a
 * ?v=<md5 hash> query string matching the hash of the actual file content.
 * No mocks — this is the same script Netlify runs on deploy.
 *
 * Run: npm run test:unit
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DIST = path.join(ROOT, 'dist');

function shortHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

describe('build-netlify.js — cache busting', () => {
    let indexHtml;

    beforeAll(() => {
        execFileSync('node', [path.join(ROOT, 'scripts', 'build-netlify.js')], { cwd: ROOT });
        indexHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    });

    afterAll(() => {
        fs.rmSync(DIST, { recursive: true, force: true });
    });

    test('applies a valid 8-char md5 hash as ?v= on script.min.js', () => {
        const expectedHash = shortHash(path.join(ROOT, 'script.min.js'));
        expect(indexHtml).toMatch(new RegExp(`src="script\\.min\\.js\\?v=${expectedHash}"`));
    });

    test('applies a valid 8-char md5 hash as ?v= on styles.min.css', () => {
        const expectedHash = shortHash(path.join(ROOT, 'styles.min.css'));
        expect(indexHtml).toMatch(new RegExp(`href="styles\\.min\\.css\\?v=${expectedHash}"`));
    });

    test('hash format is exactly 8 lowercase hex characters', () => {
        const scriptMatch = indexHtml.match(/src="script\.min\.js\?v=([0-9a-f]+)"/);
        const stylesMatch = indexHtml.match(/href="styles\.min\.css\?v=([0-9a-f]+)"/);
        expect(scriptMatch).not.toBeNull();
        expect(stylesMatch).not.toBeNull();
        expect(scriptMatch[1]).toHaveLength(8);
        expect(stylesMatch[1]).toHaveLength(8);
    });
});
