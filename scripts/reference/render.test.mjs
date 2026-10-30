import assert from 'node:assert/strict';
import { test } from 'node:test';
import { interfaceDocument, sampleDocument } from './fixtures.mjs';
import { buildTypeIndex, namespaceFolder, renderReference, typeSlug } from './render.mjs';

const BASE = '/docs/';
const local = (document) => ({ component: { assembly: document.assembly }, document, origin: { kind: 'local', file: 'x' } });
const release = (document, prerelease) => ({
	component: { assembly: document.assembly },
	document,
	origin: { kind: 'release', tag: 'pbsloadercommonutils-v2.0.0', url: 'https://github.com/r/releases/tag/t', prerelease },
});

function page(result, path) {
	const found = result.pages.find((p) => p.path === path);
	assert.ok(found, `página ${path} não gerada; geradas: ${result.pages.map((p) => p.path).join(', ')}`);
	return found.content;
}

test('caminhos por biblioteca, namespace e tipo', () => {
	assert.equal(namespaceFolder('PBSLoaderCommonUtils', 'PBSLoaderCommonUtils'), '');
	assert.equal(namespaceFolder('PBSLoaderCommonUtils', 'PBSLoaderCommonUtils.Veiculos'), 'veiculos');
	assert.equal(namespaceFolder('PBSLoaderCommonUtils', 'Outro.Ns'), 'outro-ns');
	assert.equal(namespaceFolder('PBSLoaderCommonUtils', undefined), '');
	const motor = sampleDocument().types[3];
	assert.equal(typeSlug('PBSLoaderCommonUtils', motor), 'referencia/pbsloadercommonutils/veiculos/veiculo-motor');
	assert.equal(typeSlug('PBSLoaderCommonUtils', { fullName: 'Opcao`1', name: 'Opcao<T>' }), 'referencia/pbsloadercommonutils/opcao-1');
});

test('sem biblioteca carregada: só a visão geral avisando, e sidebar vazia', () => {
	const result = renderReference([], { base: BASE });
	assert.deepEqual(result.sidebar, []);
	assert.equal(result.pages.length, 1);
	assert.match(page(result, 'referencia/index.md'), /ainda não foi publicada/);
});

test('visão geral e página da biblioteca', () => {
	const result = renderReference([release(sampleDocument(), true), local(interfaceDocument())], { base: BASE });
	const overview = page(result, 'referencia/index.md');
	assert.match(overview, /\| \[PBSLoaderCommonUtils\]\(\/docs\/referencia\/pbsloadercommonutils\/\) \| 2\.0\.0 \| 7 \|/);
	assert.match(overview, /editUrl: false/);

	const library = page(result, 'referencia/pbsloadercommonutils/index.md');
	assert.match(library, /Gerada do release \[`pbsloadercommonutils-v2\.0\.0`\]\(https:\/\/github\.com\/r\/releases\/tag\/t\) \(versão de teste\)\./);
	assert.match(library, /## `PBSLoaderCommonUtils`/);
	assert.match(library, /\| \[`Sdk`\]\(\/docs\/referencia\/pbsloadercommonutils\/sdk\/\) \| classe estática \| Ciclo de vida do SDK\. \|/);
	assert.match(library, /\| classe abstrata \|/);
	assert.match(library, /## `\(global\)`/);
	assert.match(page(result, 'referencia/pbsloadercommoninterface/index.md'), /Gerada de um build local da versão 0\.4\.0\./);
	assert.doesNotMatch(page(result, 'referencia/pbsloadercommonutils/index.md'), /\(versão de teste\)\.\n\n## `Outro`/);
});

test('release estável não leva a marca de versão de teste', () => {
	const result = renderReference([release(sampleDocument(), false)], { base: BASE });
	assert.doesNotMatch(page(result, 'referencia/pbsloadercommonutils/index.md'), /versão de teste/);
});

test('página de tipo com membros, docs e links', () => {
	const result = renderReference([local(sampleDocument())], { base: BASE });
	const sdk = page(result, 'referencia/pbsloadercommonutils/sdk.md');
	assert.match(sdk, /^---\ntitle: "Sdk"\ndescription: "Ciclo de vida do SDK\."\neditUrl: false\n---/);
	assert.match(sdk, /Namespace `PBSLoaderCommonUtils` · classe estática · PBSLoaderCommonUtils 2\.0\.0/);
	assert.match(sdk, /```csharp\npublic static class Sdk\n```/);
	assert.match(sdk, /Use `Sdk.Fase` antes de &lt;ler&gt;\./);
	assert.match(sdk, /Exemplo:\n\n```csharp\nSdk.Requer/);
	assert.match(sdk, /## Constantes\n\n### Versao/);
	assert.match(sdk, /## Métodos\n\n### Requer/);
	assert.match(sdk, /Parâmetros:\n\n- `versaoMinima` \(`string`\): A mínima\.\n- `mod` \(`string`\)/);
	assert.match(sdk, /Retorna `bool`: true se serve\./);
	assert.match(sdk, /Valor: nada/);
	assert.match(sdk, /:::caution\[Obsoleto\]\nNão use em código novo\.\n:::/);
	assert.match(sdk, /## Eventos\n\n### FaseMudou/);
	assert.ok(sdk.indexOf('## Constantes') > sdk.indexOf('## Eventos'));
	// Sem descrição de parâmetro nem de retorno, a assinatura basta.
	const seguro = sdk.slice(sdk.indexOf('### Seguro'));
	assert.doesNotMatch(seguro, /Parâmetros:|Retorna/);
});

test('enum vira tabela de valores', () => {
	const fase = page(renderReference([local(sampleDocument())], { base: BASE }), 'referencia/pbsloadercommonutils/fase.md');
	assert.match(fase, /· enumeração ·/);
	assert.match(fase, /\| `Menu` \| 0 \| No menu \\\| principal\. \|/);
	assert.match(fase, /\| `Dirigindo` \| 3 \|  \|/);
});

test('tipos aninhados, herança, obsoleto e links pelo nome curto', () => {
	const result = renderReference([local(sampleDocument())], { base: BASE });
	const veiculo = page(result, 'referencia/pbsloadercommonutils/veiculos/veiculo.md');
	assert.match(veiculo, /description: "classe estática PBSLoaderCommonUtils\.Veiculos\.Veiculo"/);
	assert.match(veiculo, /## Tipos aninhados\n\n- \[`Veiculo\.Motor`\]\(\/docs\/referencia\/pbsloadercommonutils\/veiculos\/veiculo-motor\/\): Motor do ônibus\./);

	const motor = page(result, 'referencia/pbsloadercommonutils/veiculos/veiculo-motor.md');
	assert.match(motor, /Declarado dentro de \[`Veiculo`\]\(\/docs\/referencia\/pbsloadercommonutils\/veiculos\/veiculo\/\)\./);
	assert.match(motor, /## Propriedades\n\n### Rpm\n\n```csharp\npublic static float Rpm \{ get; \}\n```\n$/);

	const script = page(result, 'referencia/pbsloadercommonutils/conteudo/scriptdeonibus.md');
	assert.match(script, /Herda de `Script`\./);
	assert.match(script, /:::caution\[Obsoleto\]\nUse outro\.\n:::/);
	assert.match(script, /Parâmetros de tipo:\n\n- `T`: O tipo\./);
	assert.match(script, /- `fase` \(\[`Fase`\]\(\/docs\/referencia\/pbsloadercommonutils\/fase\/\)\): A fase\./);

	const global = page(result, 'referencia/pbsloadercommonutils/outro/global.md');
	assert.match(global, /· struct ·/);
	assert.match(global, /Herda de `Desconhecido`\./);
	assert.match(global, /## Campos/);
	assert.match(page(result, 'referencia/pbsloadercommonutils/semnamespace.md'), /Namespace `\(global\)` · delegate/);
});

test('nome curto repetido entre bibliotecas não vira link', () => {
	const result = renderReference([local(sampleDocument()), local(interfaceDocument())], { base: BASE });
	const script = page(result, 'referencia/pbsloadercommonutils/conteudo/scriptdeonibus.md');
	assert.match(script, /- `fase` \(`Fase`\): A fase\./);
	const index = buildTypeIndex([local(sampleDocument()), local(interfaceDocument())], BASE);
	assert.equal(index.byName.get('Fase'), null);
	assert.equal(index.byFullName.get('PBSLoaderCommonInterface.Fase').url, '/docs/referencia/pbsloadercommoninterface/fase/');
});

test('declarado dentro de tipo que não está no documento', () => {
	const document = sampleDocument();
	document.types[3].declaringType = 'Fora.Daqui';
	const motor = page(renderReference([local(document)], { base: BASE }), 'referencia/pbsloadercommonutils/veiculos/veiculo-motor.md');
	assert.match(motor, /Declarado dentro de `Fora\.Daqui`\./);
});

test('sidebar por biblioteca e namespace', () => {
	const { sidebar } = renderReference([local(sampleDocument()), local(interfaceDocument())], { base: BASE });
	assert.deepEqual(sidebar[0], { label: 'Visão geral', slug: 'referencia' });
	const utils = sidebar[1];
	assert.equal(utils.label, 'PBSLoaderCommonUtils');
	assert.equal(utils.collapsed, true);
	assert.deepEqual(utils.items[0], { label: 'Visão geral', slug: 'referencia/pbsloadercommonutils' });
	const labels = utils.items.slice(1).map((group) => group.label);
	assert.deepEqual(labels, ['(global)', 'Outro', 'PBSLoaderCommonUtils', 'PBSLoaderCommonUtils.Conteudo', 'PBSLoaderCommonUtils.Veiculos']);
	const veiculos = utils.items.find((group) => group.label === 'PBSLoaderCommonUtils.Veiculos');
	assert.deepEqual(veiculos.items, [
		{ label: 'Veiculo', slug: 'referencia/pbsloadercommonutils/veiculos/veiculo' },
		{ label: 'Veiculo.Motor', slug: 'referencia/pbsloadercommonutils/veiculos/veiculo-motor' },
	]);
	assert.equal(sidebar[2].label, 'PBSLoaderCommonInterface');
});
