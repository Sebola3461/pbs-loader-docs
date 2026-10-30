// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLlmsTxt from 'starlight-llms-txt';

const repositorio = 'https://github.com/Sebola3461/pbs-loader-docs';

export default defineConfig({
	site: 'https://sebola3461.github.io',
	base: '/pbs-loader-docs',
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
			social: [{ icon: 'github', label: 'GitHub', href: repositorio }],
			editLink: { baseUrl: `${repositorio}/edit/main/` },
			lastUpdated: true,
			sidebar: [
				{
					label: 'Começando',
					items: [{ slug: 'comecando/sobre-esta-documentacao' }],
				},
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
				}),
			],
		}),
	],
});
