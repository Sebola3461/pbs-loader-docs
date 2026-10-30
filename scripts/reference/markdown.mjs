// Utilitários de texto para as páginas geradas. O conteúdo vem de um arquivo baixado: nada dele vira HTML cru.

const SAFE_LINK = /^(https?:|mailto:|\/|#|\.)/i;

/** Escapa `<` fora de blocos e trechos de código e desfaz links com esquema perigoso (javascript:, data:...). */
export function sanitizeMarkdown(text) {
	if (!text) return '';
	return splitCode(text)
		.map((part) => (part.code ? part.text : neutralizeLinks(part.text.replace(/</g, '&lt;'))))
		.join('');
}

function neutralizeLinks(text) {
	return text.replace(/\[([^\]]*)\]\(([^)\s]*)\)/g, (link, label, target) => (SAFE_LINK.test(target) ? link : label));
}

// Separa ```blocos``` e `trechos` do resto, sem tentar entender Markdown além disso.
function splitCode(text) {
	const parts = [];
	const pattern = /```[\s\S]*?```|`[^`\n]*`/g;
	let last = 0;
	for (const match of text.matchAll(pattern)) {
		if (match.index > last) parts.push({ code: false, text: text.slice(last, match.index) });
		parts.push({ code: true, text: match[0] });
		last = match.index + match[0].length;
	}
	if (last < text.length) parts.push({ code: false, text: text.slice(last) });
	return parts;
}

/** Primeira frase em texto puro, para description e tabelas. */
export function firstSentence(markdown, maxLength = 200) {
	if (!markdown) return '';
	const plain = markdown
		.split(/\n{2,}/)[0]
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/[`*]/g, '')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/\s+/g, ' ')
		.trim();
	const end = plain.search(/[.!?](\s|$)/);
	const sentence = end >= 0 ? plain.slice(0, end + 1) : plain;
	return sentence.length > maxLength ? sentence.slice(0, maxLength - 1).trimEnd() + '…' : sentence;
}

export function tableCell(text) {
	return text.replace(/\|/g, '\\|').replace(/\n+/g, ' ');
}

export function slugify(text) {
	return text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function frontmatter(fields) {
	const lines = Object.entries(fields).map(([key, value]) =>
		typeof value === 'object' ? `${key}:\n${Object.entries(value).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`).join('\n')}` : `${key}: ${JSON.stringify(value)}`,
	);
	return `---\n${lines.join('\n')}\n---\n`;
}

export function codeBlock(code) {
	return '```csharp\n' + code + '\n```';
}
