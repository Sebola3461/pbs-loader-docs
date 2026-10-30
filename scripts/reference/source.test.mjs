import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { interfaceDocument, sampleDocument } from './fixtures.mjs';
import { compareVersions, listReleases, loadComponents, parseDocument, pickRelease } from './source.mjs';

const UTILS = { assembly: 'PBSLoaderCommonUtils', tagPrefix: 'pbsloadercommonutils-v' };
const INTERFACE = { assembly: 'PBSLoaderCommonInterface', tagPrefix: 'pbsloadercommoninterface-v' };

const bytesOf = (value) => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value));
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

function release(tag, { prerelease = false, draft = false, assets } = {}) {
	return { tag_name: tag, html_url: `https://github.com/r/releases/tag/${tag}`, prerelease, draft, assets: assets ?? [] };
}

function apiAsset(component, url, body) {
	return { name: `${component.assembly}.api.json`, browser_download_url: url, digest: body ? `sha256:${sha256(body)}` : undefined };
}

// fetch falso: a lista de releases e os downloads respondem pelo mapa de URLs.
function fakeFetch(routes, calls = []) {
	return async (url, options) => {
		calls.push({ url, options });
		const route = routes[url];
		if (!route) return { ok: false, status: 404 };
		const body = route.status ? null : bytesOf(route);
		return {
			ok: !route.status,
			status: route.status ?? 200,
			json: async () => JSON.parse(body.toString()),
			arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
		};
	};
}

const RELEASES_URL = 'https://api.github.com/repos/Sebola3461/pbsu-loader/releases?per_page=100';

test('compareVersions ordena números e versões de teste', () => {
	assert.equal(compareVersions('2.0.10', '2.0.9'), 1);
	assert.equal(compareVersions('2.0', '2.0.0'), 0);
	assert.equal(compareVersions('2.0.0', '2.0.0-beta'), 1);
	assert.equal(compareVersions('2.0.0-beta', '2.0.0'), -1);
	assert.equal(compareVersions('2.0.0-alpha', '2.0.0-beta'), -1);
	assert.equal(compareVersions('2.0.0-beta', '2.0.0-alpha'), 1);
	assert.equal(compareVersions('1.x', '1.0'), 0);
});

test('pickRelease prefere estável, ignora rascunho, outro prefixo e release sem .api.json', () => {
	const asset = apiAsset(UTILS, 'u');
	const releases = [
		release('pbsloadercommonutils-v2.1.0', { prerelease: true, assets: [asset] }),
		release('pbsloadercommonutils-v2.0.0', { assets: [asset] }),
		release('pbsloadercommonutils-v3.0.0', { draft: true, assets: [asset] }),
		release('pbsloadercommonutils-v2.2.0', { assets: [{ name: 'PBSLoaderCommonUtils.dll' }] }),
		release('instalador-v9.0.0', { assets: [asset] }),
		{ tag_name: undefined },
	];
	assert.equal(pickRelease(releases, UTILS).release.tag_name, 'pbsloadercommonutils-v2.0.0');
	assert.equal(pickRelease(releases.slice(0, 1), UTILS).release.tag_name, 'pbsloadercommonutils-v2.1.0');
	assert.equal(pickRelease([], UTILS), null);
});

test('parseDocument valida schema, biblioteca e tipos', () => {
	assert.equal(parseDocument(bytesOf(sampleDocument()), UTILS).version, '2.0.0');
	assert.throws(() => parseDocument(bytesOf('{x'), UTILS), /não é um JSON válido/);
	assert.throws(() => parseDocument(bytesOf({ ...sampleDocument(), schema: 2 }), UTILS), /schema 2 não suportado/);
	assert.throws(() => parseDocument(bytesOf('null'), UTILS), /schema undefined/);
	assert.throws(() => parseDocument(bytesOf(sampleDocument()), INTERFACE), /é da PBSLoaderCommonUtils, não da PBSLoaderCommonInterface/);
	assert.throws(() => parseDocument(bytesOf({ ...sampleDocument(), types: null }), UTILS), /sem a lista de tipos/);
});

test('pasta local: lê cada biblioteca e avisa a que falta', async () => {
	const files = { [`dist${process.platform === 'win32' ? '\\' : '/'}PBSLoaderCommonUtils.api.json`]: bytesOf(sampleDocument()) };
	const readFileImpl = async (file) => {
		if (files[file]) return files[file];
		throw new Error('ENOENT');
	};
	const { loaded, warnings } = await loadComponents({ components: [UTILS, INTERFACE], localDir: 'dist', readFileImpl, fetchImpl: () => assert.fail('sem rede') });
	assert.equal(loaded.length, 1);
	assert.deepEqual(loaded[0].origin.kind, 'local');
	assert.equal(warnings.length, 1);
	assert.match(warnings[0], /^PBSLoaderCommonInterface: arquivo não encontrado: dist/);
});

test('releases: baixa, confere o SHA-256 e usa o token só na API', async () => {
	const utilsBody = bytesOf(sampleDocument());
	const interfaceBody = bytesOf(interfaceDocument());
	const routes = {
		[RELEASES_URL]: [
			release('pbsloadercommonutils-v2.0.0', { assets: [apiAsset(UTILS, 'https://dl/utils', utilsBody)] }),
			release('pbsloadercommoninterface-v0.4.0', { prerelease: true, assets: [apiAsset(INTERFACE, 'https://dl/interface', interfaceBody)] }),
		],
		'https://dl/utils': sampleDocument(),
		'https://dl/interface': interfaceDocument(),
	};
	const calls = [];
	const { loaded, warnings } = await loadComponents({
		components: [UTILS, INTERFACE], repository: 'Sebola3461/pbsu-loader', token: 'segredo', fetchImpl: fakeFetch(routes, calls),
	});
	assert.deepEqual(warnings, []);
	assert.deepEqual(loaded.map((entry) => entry.origin), [
		{ kind: 'release', tag: 'pbsloadercommonutils-v2.0.0', url: 'https://github.com/r/releases/tag/pbsloadercommonutils-v2.0.0', prerelease: false },
		{ kind: 'release', tag: 'pbsloadercommoninterface-v0.4.0', url: 'https://github.com/r/releases/tag/pbsloadercommoninterface-v0.4.0', prerelease: true },
	]);
	assert.equal(calls.filter((call) => call.url === RELEASES_URL).length, 1);
	assert.equal(calls[0].options.headers.Authorization, 'Bearer segredo');
	assert.equal(calls[1].options, undefined);
});

test('releases: digest diferente, HTTP de erro, release ausente e arquivo grande viram aviso', async () => {
	const big = 'x'.repeat(20 * 1024 * 1024 + 1);
	const routes = {
		[RELEASES_URL]: [
			release('pbsloadercommonutils-v2.0.0', { assets: [{ ...apiAsset(UTILS, 'https://dl/utils'), digest: 'sha256:00' }] }),
			release('pbsloadercommoninterface-v0.4.0', { assets: [apiAsset(INTERFACE, 'https://dl/missing')] }),
		],
		'https://dl/utils': sampleDocument(),
	};
	const result = await loadComponents({ components: [UTILS, INTERFACE], repository: 'Sebola3461/pbsu-loader', fetchImpl: fakeFetch(routes) });
	assert.deepEqual(result.loaded, []);
	assert.match(result.warnings[0], /SHA-256 de PBSLoaderCommonUtils\.api\.json não confere/);
	assert.match(result.warnings[1], /download de PBSLoaderCommonInterface\.api\.json falhou: HTTP 404/);

	const none = await loadComponents({ components: [UTILS], repository: 'Sebola3461/pbsu-loader', fetchImpl: fakeFetch({ [RELEASES_URL]: [] }) });
	assert.match(none.warnings[0], /nenhum release com PBSLoaderCommonUtils\.api\.json \(tags pbsloadercommonutils-v\*\)/);

	const large = await loadComponents({
		components: [UTILS], repository: 'Sebola3461/pbsu-loader',
		fetchImpl: fakeFetch({ [RELEASES_URL]: [release('pbsloadercommonutils-v2.0.0', { assets: [apiAsset(UTILS, 'https://dl/big')] })], 'https://dl/big': big }),
	});
	assert.match(large.warnings[0], /passa de 20971520 bytes/);
});

test('digest de outro algoritmo não é conferido', async () => {
	const routes = {
		[RELEASES_URL]: [release('pbsloadercommonutils-v2.0.0', { assets: [{ ...apiAsset(UTILS, 'https://dl/u'), digest: 'md5:abc' }] })],
		'https://dl/u': sampleDocument(),
	};
	const { loaded } = await loadComponents({ components: [UTILS], repository: 'Sebola3461/pbsu-loader', fetchImpl: fakeFetch(routes) });
	assert.equal(loaded.length, 1);
});

test('listReleases: erro HTTP e chamada sem token', async () => {
	const calls = [];
	await assert.rejects(listReleases('a/b', undefined, fakeFetch({ 'https://api.github.com/repos/a/b/releases?per_page=100': { status: 403 } }, calls)), /lista de releases de a\/b falhou: HTTP 403/);
	assert.equal(calls[0].options.headers.Authorization, undefined);
	const failure = await loadComponents({ components: [UTILS, INTERFACE], repository: 'a/b', fetchImpl: fakeFetch({}) });
	assert.equal(failure.warnings.length, 2);
});
