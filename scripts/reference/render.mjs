import { OUTPUT_FOLDER } from './config.mjs';
import { codeBlock, firstSentence, frontmatter, sanitizeMarkdown, slugify, tableCell } from './markdown.mjs';

const KIND_LABELS = { class: 'classe', struct: 'struct', enum: 'enumeração', interface: 'interface', delegate: 'delegate' };

const MEMBER_GROUPS = [
	['constructor', 'Construtores'],
	['property', 'Propriedades'],
	['method', 'Métodos'],
	['event', 'Eventos'],
	['constant', 'Constantes'],
	['field', 'Campos'],
];

/**
 * Gera as páginas da referência e a sidebar.
 * @param loaded saída de loadComponents: [{ component, document, origin }]
 * @returns {{ pages: { path: string, content: string }[], sidebar: object[] }}
 */
export function renderReference(loaded, { base }) {
	const index = buildTypeIndex(loaded, base);
	const pages = [renderOverview(loaded, base)];
	const libraryGroups = [];
	for (const entry of loaded) {
		pages.push(renderLibrary(entry, index));
		for (const type of entry.document.types) pages.push(renderType(type, entry, index));
		libraryGroups.push(librarySidebar(entry, index));
	}
	const sidebar = loaded.length === 0 ? [] : [{ label: 'Visão geral', slug: OUTPUT_FOLDER }, ...libraryGroups];
	return { pages, sidebar };
}

// Caminhos e URLs de cada tipo, pelo nome completo; também pelo nome curto quando ele é único (para links em textos).
export function buildTypeIndex(loaded, base) {
	const byFullName = new Map();
	const byName = new Map();
	for (const { document } of loaded) {
		for (const type of document.types) {
			const slug = typeSlug(document.assembly, type);
			const target = { slug, url: `${base}${slug}/`, type };
			byFullName.set(type.fullName, target);
			byName.set(type.name, byName.has(type.name) ? null : target);
		}
	}
	return { byFullName, byName };
}

export function typeSlug(assembly, type) {
	const folder = namespaceFolder(assembly, type.namespace);
	const relative = type.namespace ? type.fullName.slice(type.namespace.length + 1) : type.fullName;
	return [OUTPUT_FOLDER, slugify(assembly), folder, slugify(relative)].filter(Boolean).join('/');
}

export function namespaceFolder(assembly, namespace) {
	if (!namespace || namespace === assembly) return '';
	return slugify(namespace.startsWith(assembly + '.') ? namespace.slice(assembly.length + 1) : namespace);
}

function librarySlug(assembly) {
	return `${OUTPUT_FOLDER}/${slugify(assembly)}`;
}

function kindLabel(type) {
	if (type.kind === 'class' && / static class /.test(` ${type.signature} `)) return 'classe estática';
	if (type.kind === 'class' && /\babstract class\b/.test(type.signature)) return 'classe abstrata';
	return KIND_LABELS[type.kind] ?? type.kind;
}

function originText({ origin, document }) {
	if (origin.kind === 'local') return `Gerada de um build local da versão ${document.version}.`;
	const test = origin.prerelease ? ' (versão de teste)' : '';
	return `Gerada do release [\`${origin.tag}\`](${origin.url})${test}.`;
}

function typeLink(name, index) {
	const target = index.byName.get(name);
	return target ? `[\`${name}\`](${target.url})` : `\`${name}\``;
}

function groupByNamespace(types) {
	const groups = new Map();
	for (const type of types) {
		const key = type.namespace ?? '';
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(type);
	}
	return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function renderOverview(loaded, base) {
	const intro = loaded.length === 0
		? 'A referência ainda não foi publicada. Ela aparece aqui quando sair um release do PBSLoader com o arquivo `.api.json` de cada biblioteca.'
		: 'Tipos e membros públicos das bibliotecas do PBSLoader, gerados a partir da DLL de cada release. Membros sem descrição ainda não têm comentário de documentação no código.';
	const rows = loaded.map(({ document }) =>
		`| [${document.assembly}](${base}${librarySlug(document.assembly)}/) | ${document.version} | ${document.types.length} |`);
	const table = rows.length ? `\n\n| Biblioteca | Versão | Tipos |\n|---|---|---|\n${rows.join('\n')}` : '';
	return {
		path: `${OUTPUT_FOLDER}/index.md`,
		content: frontmatter({ title: 'Referência da API', description: 'Tipos e membros públicos das bibliotecas do PBSLoader.', editUrl: false })
			+ '\n' + intro + table + '\n',
	};
}

function renderLibrary(entry, index) {
	const { document } = entry;
	const sections = groupByNamespace(document.types).map(([namespace, types]) => {
		const rows = types.map((type) => {
			const target = index.byFullName.get(type.fullName);
			return `| [\`${type.name}\`](${target.url}) | ${kindLabel(type)} | ${tableCell(sanitizeMarkdown(firstSentence(type.docs?.summary)))} |`;
		});
		return `## \`${namespace || '(global)'}\`\n\n| Tipo | Categoria | Resumo |\n|---|---|---|\n${rows.join('\n')}`;
	});
	return {
		path: `${librarySlug(document.assembly)}/index.md`,
		content: frontmatter({ title: document.assembly, description: `Referência da API da ${document.assembly} ${document.version}.`, editUrl: false })
			+ `\n${originText(entry)}\n\n${sections.join('\n\n')}\n`,
	};
}

export function renderType(type, entry, index) {
	const { document } = entry;
	const target = index.byFullName.get(type.fullName);
	const parts = [header(type, document, index), codeBlock(type.signature)];
	if (type.obsolete != null) parts.push(obsoleteAside(type.obsolete));
	parts.push(...docSections(type.docs));
	parts.push(...nestedTypes(type, document, index));
	parts.push(...(type.kind === 'enum' ? [enumTable(type)] : memberSections(type, index)));
	return {
		path: `${target.slug}.md`,
		content: frontmatter({
			title: type.name,
			description: firstSentence(type.docs?.summary) || `${kindLabel(type)} ${type.fullName}`,
			editUrl: false,
		}) + '\n' + parts.filter(Boolean).join('\n\n') + '\n',
	};
}

function header(type, document, index) {
	const facts = [`Namespace \`${type.namespace ?? '(global)'}\``, kindLabel(type), `${document.assembly} ${document.version}`];
	const lines = [facts.join(' · ')];
	if (type.declaringType) {
		const parent = index.byFullName.get(type.declaringType);
		lines.push(`Declarado dentro de ${parent ? `[\`${parent.type.name}\`](${parent.url})` : `\`${type.declaringType}\``}.`);
	}
	if (type.baseType) lines.push(`Herda de ${typeLink(type.baseType, index)}.`);
	return lines.join('\n\n');
}

function docSections(docs) {
	if (!docs) return [];
	const parts = [sanitizeMarkdown(docs.summary), sanitizeMarkdown(docs.remarks)];
	if (docs.typeParameters) {
		const items = Object.entries(docs.typeParameters).map(([name, text]) => `- \`${name}\`: ${sanitizeMarkdown(text)}`);
		parts.push('Parâmetros de tipo:\n\n' + items.join('\n'));
	}
	if (docs.example) parts.push('Exemplo:\n\n' + sanitizeMarkdown(docs.example));
	return parts;
}

function nestedTypes(type, document, index) {
	const nested = document.types.filter((other) => other.declaringType === type.fullName);
	if (nested.length === 0) return [];
	const items = nested.map((other) => {
		const summary = sanitizeMarkdown(firstSentence(other.docs?.summary));
		return `- [\`${other.name}\`](${index.byFullName.get(other.fullName).url})${summary ? `: ${summary}` : ''}`;
	});
	return ['## Tipos aninhados\n\n' + items.join('\n')];
}

function enumTable(type) {
	const rows = type.members.map((member) =>
		`| \`${member.name}\` | ${member.value} | ${tableCell(sanitizeMarkdown(member.docs?.summary))} |`);
	return `## Valores\n\n| Nome | Valor | Descrição |\n|---|---|---|\n${rows.join('\n')}`;
}

function memberSections(type, index) {
	return MEMBER_GROUPS.map(([kind, title]) => {
		const members = type.members.filter((member) => member.kind === kind);
		if (members.length === 0) return null;
		return `## ${title}\n\n` + members.map((member) => renderMember(member, index)).join('\n\n');
	}).filter(Boolean);
}

export function renderMember(member, index) {
	const parts = [`### ${member.name}`, codeBlock(member.signature)];
	if (member.obsolete != null) parts.push(obsoleteAside(member.obsolete));
	const docs = member.docs ?? {};
	parts.push(sanitizeMarkdown(docs.summary));
	if (member.parameters?.some((parameter) => parameter.description)) {
		const items = member.parameters.map((parameter) =>
			`- \`${parameter.name}\` (${typeLink(parameter.type, index)})${parameter.description ? `: ${sanitizeMarkdown(parameter.description)}` : ''}`);
		parts.push('Parâmetros:\n\n' + items.join('\n'));
	}
	if (member.returns?.description) parts.push(`Retorna ${typeLink(member.returns.type, index)}: ${sanitizeMarkdown(member.returns.description)}`);
	if (docs.value) parts.push('Valor: ' + sanitizeMarkdown(docs.value));
	parts.push(sanitizeMarkdown(docs.remarks));
	if (docs.example) parts.push('Exemplo:\n\n' + sanitizeMarkdown(docs.example));
	return parts.filter(Boolean).join('\n\n');
}

function obsoleteAside(message) {
	return `:::caution[Obsoleto]\n${sanitizeMarkdown(message) || 'Não use em código novo.'}\n:::`;
}

function librarySidebar({ document }, index) {
	const namespaces = groupByNamespace(document.types).map(([namespace, types]) => ({
		label: namespace || '(global)',
		collapsed: true,
		items: types.map((type) => ({ label: type.name, slug: index.byFullName.get(type.fullName).slug })),
	}));
	return {
		label: document.assembly,
		collapsed: false,
		items: [{ label: 'Visão geral', slug: librarySlug(document.assembly) }, ...namespaces],
	};
}
