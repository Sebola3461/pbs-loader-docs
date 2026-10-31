---
title: Como o PBSU Loader funciona
description: As peças do PBSU Loader, as duas pastas de mods que existem e a ordem em que tudo carrega.
sidebar:
  order: 1
---

O Proton Bus Simulator Urbano não carrega código de terceiros sozinho. Quem faz isso é o MelonLoader, e o PBSU Loader é o conjunto de peças em volta dele: um instalador, duas bibliotecas obrigatórias e um catálogo de mods.

## As peças

| Peça | O que é | Onde fica |
|---|---|---|
| MelonLoader | Carregador de mods para jogos Unity. Entra no jogo pelo `version.dll` e carrega toda DLL que estiver na pasta `Mods`. O PBSU Loader usa a versão 0.7.3. | `version.dll` e `MelonLoader/` na pasta do jogo |
| PBSLoaderCommonUtils | O SDK. Lê o estado do jogo a cada quadro e entrega esses dados ao seu mod em classes como `Veiculo`, `Mapa` e `Tempo`. Também carrega os scripts de ônibus e de mapa. A parte visual fica com a PBSLoaderCommonInterface. | `Mods/PBSLoaderCommonUtils.dll` |
| PBSLoaderCommonInterface | A interface comum: menus redesenhados, o menu **Mods** com as opções de cada mod, o painel de condução e os avisos na tela. Outros mods usam ela para ter painéis e cartões no HUD. | `Mods/PBSLoaderCommonInterface.dll` |
| Instalador (`PbsuLoader.exe`) | Programa do Windows que instala o MelonLoader, as duas bibliotecas e os mods escolhidos, e atualiza tudo depois. | onde o jogador baixar |
| Catálogo (`catalogo.json`) | A lista de mods que o instalador oferece. Cada mod fica no repositório do autor e entra no catálogo por pull request. | [repositório do PBSU Loader](https://github.com/Sebola3461/pbsu-loader) |
| O seu mod | Uma DLL do MelonLoader compilada contra a PBSLoaderCommonUtils, ou um script que vem junto de um ônibus ou mapa. Veja [Tipos de mod](../tipos-de-mod/). | depende do tipo |

As duas bibliotecas são obrigatórias: o instalador sempre instala as duas, e um mod do catálogo pode contar com elas presentes.

## Duas pastas de mods

A palavra "mods" aparece em dois lugares que não têm nada a ver um com o outro.

A pasta `Mods` do MelonLoader fica dentro da pasta do jogo, junto do `Proton Bus Simulator.exe`. Ela guarda código: as DLLs que o MelonLoader carrega quando o jogo abre.

```
<pasta do jogo>/
  Proton Bus Simulator.exe
  version.dll                    MelonLoader
  MelonLoader/
    Latest.log                   log de todos os mods
  Mods/
    PBSLoaderCommonUtils.dll
    PBSLoaderCommonInterface.dll
    SeuMod.dll
  UserData/
    MelonPreferences.cfg         opções e atalhos dos mods
    PBSLoaderCommonUtils/        dados do SDK (salvos, diagnóstico)
```

A pasta de mods do jogo é a que o próprio Proton usa para conteúdo feito pela comunidade: ônibus, mapas, letreiros e pinturas. O local dela é definido pelo jogo, e o SDK informa os caminhos em [`Caminhos`](/pbs-loader-docs/referencia/pbsloadercommonutils/partida/caminhos/) (`Caminhos.ModsDeOnibus`, `Caminhos.ModsDeMapas` e outros).

```
<pasta de mods do jogo>/
  buses/
    Meu Onibus.ini               descrição do ônibus; [config] baseDir aponta a pasta
    Meu Onibus/                  modelos, sons, texturas
      scripts/                   script de ônibus (opcional, só com o SDK)
  maps/
    Meu Mapa.map.txt             descrição do mapa; [map] baseDir aponta a pasta
    Meu Mapa/
      scripts/                   script de mapa (opcional, só com o SDK)
  dest/                          letreiros
  skins/                         pinturas
```

O jogo não conhece a pasta `scripts/`: quem procura por ela é a PBSLoaderCommonUtils, quando aquele ônibus ou mapa entra em jogo.

## Ordem de carregamento

1. O jogo abre, e o MelonLoader carrega as DLLs de `Mods`.
2. A PBSLoaderCommonUtils inicia primeiro. Ela tem prioridade -1000 no MelonLoader, então, quando o `OnUpdate` do seu mod roda, os dados do quadro já estão atualizados.
3. A PBSLoaderCommonInterface e os outros mods iniciam. Um mod declara que depende das bibliotecas com `[assembly: MelonAdditionalDependencies("PBSLoaderCommonUtils")]`, e o MelonLoader respeita essa ordem.
4. Durante a partida, quando o jogador entra num ônibus ou carrega um mapa que tem `scripts/`, a PBSLoaderCommonUtils pede permissão ao jogador na primeira vez e liga os scripts daquele conteúdo.

O caminho do jogador até a direção (menu, escolha do ônibus, carregamento) e os eventos de cada etapa estão em [Ciclo de uma partida](../ciclo-da-partida/).

## O que o SDK resolve

Sem o SDK, um mod para o Proton precisa conhecer as classes internas do jogo (`MEPControlesBus`, `VPVehicleController` e centenas de outras, expostas pelo IL2CPP com o prefixo `Il2Cpp`) e escrever patches Harmony nelas. Esses nomes mudam quando o jogo atualiza, e dois mods que fazem patch no mesmo método brigam entre si.

A PBSLoaderCommonUtils concentra esse trabalho num lugar só. Ela lê o jogo e expõe o resultado em propriedades estáveis, com nomes em português e a unidade no nome (`Veiculo.VelocidadeKmh`). Os pontos onde um mod precisa entrar no jogo viram [ganchos](/pbs-loader-docs/referencia/pbsloadercommonutils/ganchos/), com um patch só para todos os mods. Quando o jogo muda de versão, o SDK é atualizado uma vez, e os mods continuam funcionando.
