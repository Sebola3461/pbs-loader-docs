---
title: Sobre esta documentação
description: Para quem é esta documentação, que versões ela cobre e como usá-la com assistentes de IA.
---

Esta documentação é para quem escreve mods em C# para o Proton Bus Simulator Urbano usando o SDK do PBSU Loader, a biblioteca PBSLoaderCommonUtils. Quem só quer jogar com mods encontra o instalador e as instruções no [repositório do PBSU Loader](https://github.com/Sebola3461/pbsu-loader).

A [referência da API](/pbs-loader-docs/referencia/) lista cada classe, propriedade, método e evento público da PBSLoaderCommonUtils e da PBSLoaderCommonInterface, com a assinatura em C#. Ela é gerada a partir das DLLs de cada release.

## Versões cobertas

| Item | Versão |
|---|---|
| API do SDK (`Sdk.Versao`) | 2.0.0 |
| Jogo | 307 |
| MelonLoader | 0.7.3 |

Uma mudança no primeiro número da API quebra mods escritos para a versão anterior. Use `Sdk.Requer("2.0", "MeuMod")` no começo do mod para que ele fique parado, com um aviso ao jogador, quando o SDK instalado for velho demais.

## Nomes em português

Classes, propriedades e eventos do SDK têm nomes em português, com a unidade no nome quando há uma: `Veiculo.VelocidadeKmh`, `Veiculo.Suspensao.AlturaM`, `Tempo.DuracaoDoDiaMin`. Os exemplos desta documentação usam os nomes exatamente como estão na DLL.

## Usar com assistentes de IA

O site publica a documentação inteira em formatos que um assistente de IA consegue ler de uma vez:

| Arquivo | Conteúdo |
|---|---|
| [`llms.txt`](/pbs-loader-docs/llms.txt) | resumo do SDK e lista das páginas, no formato de [llmstxt.org](https://llmstxt.org/) |
| [`llms-full.txt`](/pbs-loader-docs/llms-full.txt) | todas as páginas num arquivo só |
| [`llms-small.txt`](/pbs-loader-docs/llms-small.txt) | o mesmo, sem notas e dicas, para contextos curtos |

Cada página também existe em Markdown puro. Troque a barra final da URL por `.md`: esta página, por exemplo, fica em [`comecando/sobre-esta-documentacao.md`](/pbs-loader-docs/comecando/sobre-esta-documentacao.md).

Ao pedir código a um assistente, passe o `llms-full.txt` e diga que os nomes da API não devem ser traduzidos. Sem isso, é comum o assistente inventar `Vehicle.SpeedKmh` no lugar de `Veiculo.VelocidadeKmh`.

## Licença

O texto desta documentação está sob a licença [Creative Commons Atribuição 4.0 Internacional (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/deed.pt-br). Dá para copiar e adaptar, inclusive em outros sites, desde que o crédito e o link para a fonte apareçam junto.

Encontrou um erro? Use o link de edição no fim de cada página para abrir uma correção no GitHub.
