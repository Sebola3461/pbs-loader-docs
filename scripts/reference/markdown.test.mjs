import assert from 'node:assert/strict';
import { test } from 'node:test';
import { codeBlock, firstSentence, frontmatter, sanitizeMarkdown, slugify, tableCell } from './markdown.mjs';

test('sanitizeMarkdown escapa HTML fora de código e mantém o código', () => {
	assert.equal(sanitizeMarkdown('<script>x</script> e `List<T>`'), '&lt;script>x&lt;/script> e `List<T>`');
	assert.equal(sanitizeMarkdown('antes\n```csharp\nvar a = b < c;\n```\ndepois <b>'), 'antes\n```csharp\nvar a = b < c;\n```\ndepois &lt;b>');
	assert.equal(sanitizeMarkdown(undefined), '');
});

test('sanitizeMarkdown desfaz links com esquema perigoso', () => {
	assert.equal(sanitizeMarkdown('[clique](javascript:alert(1))'), 'clique)');
	assert.equal(sanitizeMarkdown('[d](data:text/html,x)'), 'd');
	assert.equal(sanitizeMarkdown('[ok](https://x.dev) [rel](/a/) [anc](#b) [mail](mailto:a@b.c)'), '[ok](https://x.dev) [rel](/a/) [anc](#b) [mail](mailto:a@b.c)');
});

test('firstSentence tira a formatação e corta na primeira frase', () => {
	assert.equal(firstSentence('Use `Sdk.Fase` e [o link](https://x). Depois mais.'), 'Use Sdk.Fase e o link.');
	assert.equal(firstSentence('Sem ponto final'), 'Sem ponto final');
	assert.equal(firstSentence('Primeiro parágrafo\n\nSegundo.'), 'Primeiro parágrafo');
	assert.equal(firstSentence('Usa List&lt;T&gt;.'), 'Usa List<T>.');
	assert.equal(firstSentence('a'.repeat(30), 10), 'aaaaaaaaa…');
	assert.equal(firstSentence(null), '');
});

test('slugify, tableCell, frontmatter e codeBlock', () => {
	assert.equal(slugify('Veículo.Motor`1'), 'veiculo-motor-1');
	assert.equal(slugify('--A b--'), 'a-b');
	assert.equal(tableCell('a | b\n\nc'), 'a \\| b c');
	assert.equal(frontmatter({ title: 'Título "x"', editUrl: false, sidebar: { label: 'L' } }), '---\ntitle: "Título \\"x\\""\neditUrl: false\nsidebar:\n  label: "L"\n---\n');
	assert.equal(codeBlock('int x;'), '```csharp\nint x;\n```');
});
