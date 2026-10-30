// @ts-check
import { existsSync, readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLlmsTxt from 'starlight-llms-txt';
import { BASE, REPOSITORY, SITE } from './site.config.mjs';

// Gerado por `npm run reference` a partir do .api.json dos releases; sem ele, o site sai sem a referência.
const referenceSidebarFile = new URL('./src/generated/reference-sidebar.json', import.meta.url);
const referenceSidebar = existsSync(referenceSidebarFile) ? JSON.parse(readFileSync(referenceSidebarFile, 'utf8')) : [];
const hasReference = referenceSidebar.length > 0;

export default defineConfig({
	site: SITE,
	base: BASE,
	trailingSlash: 'always',
	integrations: [
		starlight({
			title: 'PBSU Loader SDK',
			description:
				'Documentação do SDK de mods do Proton Bus Simulator Urbano (PBSLoaderCommonUtils), em português.',
			defaultLocale: 'root',
			locales: {
				root: { label: 'Português', lang: 'pt-BR' },
			},
			social: [{ icon: 'github', label: 'GitHub', href: REPOSITORY }],
			editLink: { baseUrl: `${REPOSITORY}/edit/main/` },
			lastUpdated: true,
			sidebar: [
				{
					label: 'Começando',
					items: [{ slug: 'comecando/sobre-esta-documentacao' }],
				},
				...(hasReference ? [{ label: 'Referência da API', items: referenceSidebar }] : []),
			],
			plugins: [
				starlightLlmsTxt({
					projectName: 'PBSU Loader SDK (PBSLoaderCommonUtils)',
					description:
						'SDK em C# para mods MelonLoader do Proton Bus Simulator Urbano. Lê o jogo (veículo, mapa, linha, passageiros, hora, clima, câmera) e expõe classes estáticas com nomes em português.',
					details: [
						'- A API é em português: `Veiculo.VelocidadeKmh`, `Sdk.Fase`, `Ganchos.PortaPedida`. Não traduza os nomes ao gerar código.',
						'- Toda chamada ao SDK acontece na thread principal (OnUpdate, OnFixedUpdate, OnLateUpdate, OnGUI ou eventos do SDK).',
						'- Fora de uma partida as propriedades devolvem o valor padrão em vez de lançar exceção. Confira `Veiculo.Existe` ou `Sdk.Fase`.',
						'- Cada página também existe em Markdown puro: troque a barra final da URL por `.md` (por exemplo `.../comecando/sobre-esta-documentacao.md`).',
					].join('\n'),
					customSets: hasReference
						? [
								{
									label: 'Referência da API',
									paths: ['referencia/**'],
									description: 'assinatura em C# e descrição de cada tipo e membro público da PBSLoaderCommonUtils e da PBSLoaderCommonInterface',
								},
							]
						: [],
				}),
			],
		}),
	],
});
