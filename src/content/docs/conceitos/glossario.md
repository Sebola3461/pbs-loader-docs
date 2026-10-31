---
title: Glossário
description: Termos que aparecem no SDK e nesta documentação.
sidebar:
  order: 4
---

| Termo | Significado |
|---|---|
| Biblioteca obrigatória | A PBSLoaderCommonUtils e a PBSLoaderCommonInterface. O instalador sempre instala as duas. |
| Catálogo | O `catalogo.json` do repositório do PBSLoader, com os mods que o instalador oferece. |
| EVP5 | Um dos sistemas de física de veículo do jogo. Nele o SDK lê os campos do jogo e não tem leitura da embreagem nem das rodas. Veja `Veiculo.Fisica`. |
| Fachada | Uma classe do SDK que lê o jogo e expõe o resultado com nomes estáveis, como `Veiculo`, `Mapa` e `Tempo`. |
| Fase | Em que parte do jogo o jogador está: `Menu`, `Selecao`, `Carregando` ou `Dirigindo`. Veja [Ciclo de uma partida](../ciclo-da-partida/). |
| Gancho | Um ponto do jogo onde o mod entra sem escrever patch Harmony, como `Ganchos.DepoisDaFisica` e `Ganchos.PortaPedida`. A PBSLoaderCommonUtils aplica um patch só e chama todos os inscritos. |
| Geração | Número que muda a cada veículo (`Veiculo.Geracao`) ou mapa (`Mapa.Geracao`) carregado. Serve para saber quando reconstruir o estado. |
| Harmony | Biblioteca que altera métodos de outro programa em tempo de execução. Vem com o MelonLoader. |
| IL2CPP | Forma como o jogo foi compilado: o código C# virou C++ nativo. O MelonLoader gera classes de acesso com o prefixo `Il2Cpp`, que mudam quando o jogo atualiza. |
| Letreiro | O painel de destino do ônibus. Os letreiros de mod ficam em `dest/`, na pasta de mods do jogo. |
| MelonLoader | O carregador de mods. Carrega as DLLs de `Mods` quando o jogo abre. |
| Modo seguro | Estado do SDK numa versão do jogo em que ele não foi testado. Os ganchos não disparam, `Conducao` e o freio a ar não escrevem no jogo e `Avancado` devolve `null`. As fachadas de leitura continuam funcionando. |
| Pacote | Uma pasta `scripts/` de ônibus ou de mapa, com o `pbsu.json` e a DLL. No código, a classe [`Pacote`](/pbs-loader-docs/referencia/pbsloadercommonutils/conteudo/pacote/). |
| Pasta de mods do jogo | A pasta que o Proton usa para ônibus, mapas, letreiros e pinturas. É outra pasta, diferente da `Mods` do MelonLoader. Veja [Como o PBSLoader funciona](../como-funciona/#duas-pastas-de-mods). |
| `pbsu.json` | O arquivo que descreve um pacote de scripts: `id`, `nome`, `autor`, `versao`, `sdkMinimo` e `dll`. |
| Script de conteúdo | Script de ônibus ou script de mapa. Veja [Tipos de mod](../tipos-de-mod/). |
| SHA-256 | Impressão digital de um arquivo. O instalador confere a de cada download, e a permissão de um script vale para a SHA-256 da DLL dele. |
| Tile | Um pedaço de um mapa grande, carregado conforme o ônibus anda. |
| VPP | Vehicle Physics Pro, o sistema de física usado na maior parte dos ônibus do jogo. Os pedidos de `Conducao` e os ganchos de física só funcionam nele. |
| Versão de teste | Um release marcado como pré-lançamento no GitHub. O instalador só mostra para quem marca *Incluir versões de teste*. |
