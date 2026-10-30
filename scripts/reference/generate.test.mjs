import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { sampleDocument } from './fixtures.mjs';
import { MARKER, generateReference, prepareOutput } from './generate.mjs';

async function tempRoot() {
	return mkdtemp(path.join(tmpdir(), 'pbs-docs-'));
}

function collectingLog() {
	const lines = { log: [], warn: [] };
	return { lines, log: { log: (line) => lines.log.push(line), warn: (line) => lines.warn.push(line) } };
}

test('gera páginas e sidebar a partir da pasta local e avisa a biblioteca que falta', async () => {
	const root = await tempRoot();
	const apiDir = path.join(root, 'api');
	await mkdir(apiDir);
	await writeFile(path.join(apiDir, 'PBSLoaderCommonUtils.api.json'), JSON.stringify(sampleDocument()));
	const { lines, log } = collectingLog();

	const code = await generateReference({ root, env: { PBS_API_DIR: apiDir }, log });

	assert.equal(code, 0);
	const docs = path.join(root, 'src', 'content', 'docs', 'referencia');
	assert.ok(existsSync(path.join(docs, MARKER)));
	assert.match(await readFile(path.join(docs, 'pbsloadercommonutils', 'sdk.md'), 'utf8'), /title: "Sdk"/);
	const sidebar = JSON.parse(await readFile(path.join(root, 'src', 'generated', 'reference-sidebar.json'), 'utf8'));
	assert.equal(sidebar[1].label, 'PBSLoaderCommonUtils');
	assert.match(lines.warn[0], /^aviso: PBSLoaderCommonInterface: arquivo não encontrado/);
	assert.match(lines.log[0], /PBSLoaderCommonUtils 2\.0\.0: 7 tipos/);
	await rm(root, { recursive: true, force: true });
});

test('--strict falha quando falta biblioteca, e o aviso sai no formato do GitHub Actions', async () => {
	const root = await tempRoot();
	const { lines, log } = collectingLog();
	const code = await generateReference({ root, env: { PBS_API_DIR: path.join(root, 'vazio'), GITHUB_ACTIONS: 'true' }, strict: true, log });
	assert.equal(code, 1);
	assert.match(lines.warn[0], /^::warning title=Referência da API::PBSLoaderCommonUtils:/);
	assert.match(await readFile(path.join(root, 'src', 'content', 'docs', 'referencia', 'index.md'), 'utf8'), /ainda não foi publicada/);
	await rm(root, { recursive: true, force: true });
});

test('não apaga uma pasta referencia escrita à mão; refaz a gerada', async () => {
	const root = await tempRoot();
	const folder = path.join(root, 'referencia');
	await mkdir(folder);
	await writeFile(path.join(folder, 'manual.md'), 'texto');
	await assert.rejects(prepareOutput(folder), /não foi gerada por este script/);
	assert.ok(existsSync(path.join(folder, 'manual.md')));

	await writeFile(path.join(folder, MARKER), '');
	await prepareOutput(folder);
	assert.ok(!existsSync(path.join(folder, 'manual.md')));
	assert.ok(existsSync(path.join(folder, MARKER)));
	await rm(root, { recursive: true, force: true });
});
