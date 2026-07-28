import * as esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

const options = {
    entryPoints: ['src/index.ts'],
    bundle: true,
    outfile: 'dist/index.js',
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    external: ['react', 'react-dom'],
    loader: { '.css': 'css' },
};

if (watch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    console.log('Watching @perin/design-system for changes...');
} else {
    await esbuild.build(options);
    console.log('Build concluído: dist/index.js + dist/index.css');
}
