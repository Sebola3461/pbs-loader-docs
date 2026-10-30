import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BASE } from '../../site.config.mjs';
import { COMPONENTS, OUTPUT_FOLDER, SOURCE_REPOSITORY } from './config.mjs';
import { renderReference } from './render.mjs';
import { loadComponents } from './source.mjs';

// A pasta gerada leva este arquivo; sem ele, a pasta pode ter páginas escritas à mão e não é apagada.
export const MARKER = '.generated';

/**
 * Gera src/content/docs/referencia e src/generated/reference-sidebar.json.
 * Retorna o código de saída: 1 com --strict quando alguma biblioteca não foi carregada.
 */
export async function generateReference({ root, env = process.env, strict = false, fetchImpl, readFileImpl, log = console }) {
	const { loaded, warnings } = await loadComponents({
		components: COMPONENTS,
		repository: SOURCE_REPOSITORY,
		localDir: env.PBS_API_DIR,
		token: env.GITHUB_TOKEN,
		fetchImpl,
		readFileImpl,
	});
	const { pages, sidebar } = renderReference(loaded, { base: BASE });

	const docsDir = path.join(root, 'src', 'content', 'docs');
	await prepareOutput(path.join(docsDir, OUTPUT_FOLDER));
	for (const page of pages) {
		const file = path.join(docsDir, page.path);
		await mkdir(path.dirname(file), { recursive: true });
		await writeFile(file, page.content, 'utf8');
	}
	const sidebarFile = path.join(root, 'src', 'generated', 'reference-sidebar.json');
	await mkdir(path.dirname(sidebarFile), { recursive: true });
	await writeFile(sidebarFile, JSON.stringify(sidebar, null, '\t') + '\n', 'utf8');

	for (const warning of warnings) log.warn(env.GITHUB_ACTIONS ? `::warning title=Referência da API::${warning}` : `aviso: ${warning}`);
	for (const { document, origin } of loaded)
		log.log(`${document.assembly} ${document.version}: ${document.types.length} tipos (${origin.tag ?? origin.file})`);
	log.log(`${pages.length} páginas em ${path.join('src', 'content', 'docs', OUTPUT_FOLDER)}`);
	return strict && warnings.length > 0 ? 1 : 0;
}

export async function prepareOutput(folder) {
	if (existsSync(folder) && !existsSync(path.join(folder, MARKER)))
		throw new Error(`${folder} existe e não foi gerada por este script; mova o conteúdo antes de gerar a referência`);
	await rm(folder, { recursive: true, force: true });
	await mkdir(folder, { recursive: true });
	await writeFile(path.join(folder, MARKER), 'Pasta gerada por scripts/reference/generate.mjs. Não edite à mão.\n', 'utf8');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const root = fileURLToPath(new URL('../../', import.meta.url));
	generateReference({ root, strict: process.argv.includes('--strict') })
		.then((code) => { process.exitCode = code; })
		.catch((error) => {
			console.error(error.message);
			process.exitCode = 1;
		});
}
