import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

// Serve o Markdown original de cada página em <página>.md, para agentes de IA lerem sem o HTML.
export const getStaticPaths: GetStaticPaths = async () => {
	const pages = await getCollection('docs');
	return pages.map((page) => ({
		params: { slug: page.id === 'index' || page.id === '' ? 'index' : page.id },
		props: { page },
	}));
};

export const GET: APIRoute<{ page: CollectionEntry<'docs'> }> = ({ props }) => {
	const { title, description } = props.page.data;
	const header = description ? `# ${title}\n\n> ${description}\n\n` : `# ${title}\n\n`;
	const body = (props.page.body ?? '').replace(/^import .*\r?\n/gm, '').trimStart();
	return new Response(header + body, {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
	});
};
