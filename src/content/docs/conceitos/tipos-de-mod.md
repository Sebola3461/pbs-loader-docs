---
title: Tipos de mod
description: Mod global, script de ônibus, script de mapa e conteúdo sem código. Onde cada um fica, quando roda e qual escolher.
sidebar:
  order: 2
---

Existem quatro jeitos de mudar o jogo com o PBSLoader. Três têm código; o primeiro, não.

| | Conteúdo do jogo | Mod global | Script de ônibus | Script de mapa |
|---|---|---|---|---|
| O que é | Ônibus, mapa, letreiro ou pintura, no formato do próprio jogo | DLL do MelonLoader | DLL dentro da pasta de um ônibus | DLL dentro da pasta de um mapa |
| Onde fica | Pasta de mods do jogo (`buses/`, `maps/`, `dest/`, `skins/`) | `<pasta do jogo>/Mods` | `<pasta do ônibus>/scripts/` | `<pasta do mapa>/scripts/` |
| Quando roda | O jogo lê quando o jogador escolhe | Do momento em que o jogo abre até ele fechar | Só enquanto aquele ônibus é o veículo do jogador | Só enquanto aquele mapa está carregado |
| Precisa do SDK | Não | Não, mas quase todo mod do catálogo usa | Sim | Sim |
| Quem instala | O jogador, copiando para a pasta de mods do jogo | O instalador (catálogo) ou o jogador, copiando a DLL | Vem junto do ônibus | Vem junto do mapa |
| Pede permissão | Não | Não | Sim, na primeira vez | Sim, na primeira vez |
| Classe base | | `MelonMod` | [`ScriptDeOnibus`](/pbs-loader-docs/referencia/pbsloadercommonutils/conteudo/scriptdeonibus/) | [`ScriptDeMapa`](/pbs-loader-docs/referencia/pbsloadercommonutils/conteudo/scriptdemapa/) |

## Conteúdo do jogo (sem código)

São os mods que a comunidade do Proton sempre fez: um ônibus é um arquivo `.ini` em `buses/` mais uma pasta com modelos, texturas e sons; um mapa é um `.map.txt` em `maps/` mais a pasta dele. O jogo lê esses arquivos sozinho, sem MelonLoader e sem o PBSLoader.

O SDK lê o que o jogo carregou. `Veiculo.Pasta` é a pasta do ônibus em uso, e `Mapa.Pasta` e `Mapa.Versao` vêm do mod de mapa. `Sessao.OrigemDoOnibus` e `Mapa.Origem` dizem se aquilo veio com o jogo ou de um mod.

Uma mesma pasta de ônibus pode servir a vários `.ini`, um por variante. Por exemplo, `Torino 1519.ini` e `Torino 1519 Sul.ini` podem apontar o mesmo `[config] baseDir`. Nesse caso, as duas variantes usam os mesmos scripts.

## Mod global

É uma DLL do MelonLoader na pasta `Mods`. Ela carrega quando o jogo abre e fica ativa o tempo todo: no menu, nas telas de escolha, carregando e dirigindo. Serve para tudo que vale para qualquer ônibus ou mapa, como física de motor, câmera, gráficos, volante, interface e telemetria.

```csharp
using MelonLoader;
using PBSLoaderCommonUtils;
using PBSLoaderCommonUtils.Veiculos;

[assembly: MelonInfo(typeof(MeuMod.MeuModMod), "MeuMod", "1.0.0", "você")]
[assembly: MelonGame(null, "Proton Bus Simulator")]
[assembly: MelonAdditionalDependencies("PBSLoaderCommonUtils")]

namespace MeuMod
{
    public class MeuModMod : MelonMod
    {
        public override void OnInitializeMelon()
        {
            if (!Sdk.Requer("2.0", "MeuMod")) return;
        }

        public override void OnUpdate()
        {
            if (!Veiculo.Existe) return;   // no menu não há ônibus
            // ...
        }
    }
}
```

Como roda o tempo todo, o mod precisa conferir em que ponto o jogo está antes de ler os dados: `Sdk.Fase`, `Veiculo.Existe` ou `Mapa.Existe`. Fora de uma partida, as propriedades do SDK devolvem o valor padrão (0, `false`, `""`), sem lançar exceção.

Um mod global vai para o jogador pelo [catálogo do instalador](https://github.com/Sebola3461/pbsu-loader#para-quem-faz-mods-entrar-no-catálogo), com um release no GitHub, ou como DLL para copiar à mão em `Mods`.

## Script de ônibus

É uma DLL que o autor de um ônibus põe na pasta dele, junto de um `pbsu.json`. Ela só roda enquanto aquele ônibus é o veículo do jogador. Serve para o que é daquele modelo: um letreiro com lógica, um painel próprio, portas com regra especial, sons ou animações que o `.ini` não consegue descrever.

```
buses/
  Meu Onibus.ini
  Meu Onibus/
    scripts/
      pbsu.json
      MeuOnibus.Scripts.dll
```

```json
{
  "id": "autor.meuonibus",
  "nome": "Meu ônibus",
  "autor": "você",
  "versao": "1.0.0",
  "sdkMinimo": "2.0",
  "dll": "MeuOnibus.Scripts.dll"
}
```

```csharp
using PBSLoaderCommonUtils.Conteudo;
using PBSLoaderCommonUtils.Veiculos;

public class MeuPainel : ScriptDeOnibus
{
    public override void Ativar() => Pacote.Log.Msg("ativo em " + Veiculo.Nome);
    public override void Quadro() { /* todo quadro, enquanto este ônibus é o do jogador */ }
    public override void Desativar() { /* saia dos eventos do SDK em que entrou */ }
}
```

A diferença para um mod global é o ciclo de vida. O script não precisa conferir se o ônibus certo está em jogo, porque só roda nessa situação. A PBSLoaderCommonUtils chama `Ativar` quando o ônibus vira o do jogador e `Desativar` quando ele sai. Na saída, ela também desfaz os patches que o script aplicou pelo `Pacote.Harmony`.

O [`Pacote`](/pbs-loader-docs/referencia/pbsloadercommonutils/conteudo/pacote/) dá ao script o que um mod global teria por conta própria: preferências (`Pacote.Config`), log, atalhos que só valem com o pacote ativo, dados salvos entre sessões e acesso aos arquivos da própria pasta (`Pacote.Textura`, `Pacote.Som`, `Pacote.Modelo`).

Ônibus que vêm com o jogo não têm pasta de mod, então não têm scripts.

## Script de mapa

Funciona do mesmo jeito, na pasta do mapa (a que o `[map] baseDir` do `.map.txt` aponta), com uma classe que herda de [`ScriptDeMapa`](/pbs-loader-docs/referencia/pbsloadercommonutils/conteudo/scriptdemapa/). Roda enquanto aquele mapa está carregado e recebe `TileCarregou(cena)` a cada pedaço do mapa que termina de carregar. Serve para eventos do mapa, anúncios nos pontos, tráfego ou clima próprios de uma cidade.

```
maps/
  Meu Mapa.map.txt
  Meu Mapa/
    scripts/
      pbsu.json
      MeuMapa.Scripts.dll
```

Mapas que vêm com o jogo não têm scripts.

## Permissão do jogador

Um script de ônibus ou de mapa é código com as mesmas permissões de qualquer mod: pode ler e gravar arquivos e acessar a rede. Como ele chega dentro de um download de ônibus ou mapa, e não pelo instalador, o jogador é consultado na primeira vez que o pacote aparece. A pergunta mostra o nome, o autor, a origem e o SHA-256 da DLL, com as opções **Permitir**, **Agora não** e **Nunca**.

A decisão fica gravada pelo SHA-256. Uma DLL nova, com outro hash, pergunta de novo. Pacotes revisados pela comunidade entram no catálogo (`scriptsConfiaveis`) e rodam sem perguntar.

Um script que lança exceção em `Ativar`, ou cinco vezes seguidas no mesmo método, é desligado até o jogo fechar, e o jogador vê o motivo na tela.

## Qual escolher

- **A função vale para qualquer ônibus ou mapa** (física, câmera, interface, gráficos, volante): mod global.
- **A função é de um modelo de ônibus** e deve chegar junto dele no download: script de ônibus.
- **A função é de uma cidade ou de um mapa**: script de mapa.
- **Só muda modelo, textura, som ou parâmetros que o `.ini` ou o `.map.txt` já aceitam**: conteúdo do jogo, sem código.

Os dois caminhos se misturam. Um mod global pode ler a pasta do ônibus em uso (`Veiculo.Pasta`) e procurar arquivos de configuração deixados pelos autores de ônibus. Um script de ônibus pode publicar valores com [`Dados`](/pbs-loader-docs/referencia/pbsloadercommonutils/dados/) para um mod global ler.
