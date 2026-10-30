import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { MAX_API_BYTES, SUPPORTED_SCHEMA } from './config.mjs';

/**
 * Carrega o .api.json de cada biblioteca, de uma pasta local (PBS_API_DIR, a dist\ do release.ps1) ou do release mais
 * novo no GitHub. Uma biblioteca que falha vira aviso; as outras seguem.
 */
export async function loadComponents({ components, repository, localDir, token, fetchImpl = fetch, readFileImpl = readFile }) {
	const loaded = [];
	const warnings = [];
	let releases;
	for (const component of components) {
		try {
			if (localDir) {
				loaded.push(await loadLocal(component, localDir, readFileImpl));
				continue;
			}
			releases ??= await listReleases(repository, token, fetchImpl);
			loaded.push(await loadFromRelease(component, releases, fetchImpl));
		} catch (error) {
			warnings.push(`${component.assembly}: ${error.message}`);
		}
	}
	return { loaded, warnings };
}

async function loadLocal(component, localDir, readFileImpl) {
	const file = path.join(localDir, assetName(component));
	const bytes = await readFileImpl(file).catch(() => {
		throw new Error(`arquivo não encontrado: ${file}`);
	});
	return { component, document: parseDocument(bytes, component), origin: { kind: 'local', file } };
}

async function loadFromRelease(component, releases, fetchImpl) {
	const picked = pickRelease(releases, component);
	if (!picked) throw new Error(`nenhum release com ${assetName(component)} (tags ${component.tagPrefix}*)`);
	const { release, asset } = picked;
	const response = await fetchImpl(asset.browser_download_url);
	if (!response.ok) throw new Error(`download de ${asset.name} falhou: HTTP ${response.status}`);
	const bytes = Buffer.from(await response.arrayBuffer());
	if (bytes.length > MAX_API_BYTES) throw new Error(`${asset.name} passa de ${MAX_API_BYTES} bytes`);
	verifyDigest(bytes, asset);
	return {
		component,
		document: parseDocument(bytes, component),
		origin: { kind: 'release', tag: release.tag_name, url: release.html_url, prerelease: Boolean(release.prerelease) },
	};
}

export async function listReleases(repository, token, fetchImpl) {
	const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'pbs-loader-docs', 'X-GitHub-Api-Version': '2022-11-28' };
	if (token) headers.Authorization = `Bearer ${token}`;
	const response = await fetchImpl(`https://api.github.com/repos/${repository}/releases?per_page=100`, { headers });
	if (!response.ok) throw new Error(`lista de releases de ${repository} falhou: HTTP ${response.status}`);
	return response.json();
}

/** O release mais novo da biblioteca com o .api.json; um release estável ganha de uma versão de teste mais nova. */
export function pickRelease(releases, component) {
	const name = assetName(component);
	const candidates = releases
		.filter((release) => !release.draft && release.tag_name?.startsWith(component.tagPrefix))
		.map((release) => ({ release, asset: release.assets?.find((asset) => asset.name === name) }))
		.filter((candidate) => candidate.asset)
		.sort((a, b) => compareVersions(versionOf(b.release, component), versionOf(a.release, component)));
	return candidates.find((candidate) => !candidate.release.prerelease) ?? candidates[0] ?? null;
}

export function compareVersions(a, b) {
	const [coreA, preA] = splitVersion(a);
	const [coreB, preB] = splitVersion(b);
	for (let i = 0; i < Math.max(coreA.length, coreB.length); i++) {
		const difference = (coreA[i] ?? 0) - (coreB[i] ?? 0);
		if (difference !== 0) return Math.sign(difference);
	}
	if (preA === preB) return 0;
	if (!preA) return 1;
	if (!preB) return -1;
	return preA < preB ? -1 : 1;
}

function splitVersion(version) {
	const [core, ...pre] = version.split('-');
	return [core.split('.').map((part) => Number.parseInt(part, 10) || 0), pre.join('-')];
}

function versionOf(release, component) {
	return release.tag_name.slice(component.tagPrefix.length);
}

// O GitHub publica o SHA-256 de cada asset; sem ele (releases antigos) não há o que conferir.
function verifyDigest(bytes, asset) {
	if (!asset.digest) return;
	const [algorithm, expected] = asset.digest.split(':');
	if (algorithm !== 'sha256') return;
	const actual = createHash('sha256').update(bytes).digest('hex');
	if (actual !== expected?.toLowerCase()) throw new Error(`SHA-256 de ${asset.name} não confere com o do GitHub`);
}

export function parseDocument(bytes, component) {
	let document;
	try {
		document = JSON.parse(bytes.toString('utf8'));
	} catch {
		throw new Error(`${assetName(component)} não é um JSON válido`);
	}
	if (document?.schema !== SUPPORTED_SCHEMA) throw new Error(`schema ${document?.schema} não suportado (esperado ${SUPPORTED_SCHEMA})`);
	if (document.assembly !== component.assembly) throw new Error(`o arquivo é da ${document.assembly}, não da ${component.assembly}`);
	if (!Array.isArray(document.types)) throw new Error('arquivo sem a lista de tipos');
	return document;
}

export function assetName(component) {
	return `${component.assembly}.api.json`;
}
