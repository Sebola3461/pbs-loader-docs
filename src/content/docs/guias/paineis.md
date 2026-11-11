---
title: Painéis de mod
description: "Janelas por cima do jogo, montadas em poucas linhas: valores, chaves, campos, listas com busca, blocos que acompanham a seleção, abas e seções que abrem e fecham."
sidebar:
  order: 3
---

Um painel é uma janela que o mod abre por cima do jogo, com o tema do PBSLoader. O mod descreve o que vai nela, item por item, e o SDK desenha, lê os valores a cada quadro e chama o mod quando o jogador mexe em algo. Cada painel também vira uma ação na página do mod no menu Mods.

Os painéis ficam em `PBSLoaderCommonInterface`, a partir da versão 0.5.0 para campos e listas e da 0.7.0 para abas e seções recolhíveis. Os trechos desta página são partes de uma classe `MelonMod` com estes namespaces:

```csharp
using System.Collections.Generic;
using System.Linq;
using MelonLoader;
using PBSLoaderCommonInterface;
```

## Criar e abrir

O painel é montado uma vez, no `OnInitializeMelon`. `Paineis.Criar` recebe o identificador do mod (o mesmo da categoria de preferências), um id para o painel, o título e, se quiser, um atalho que abre e fecha a janela:

```csharp
static Painel _painel;
static float _pressao = 8.2f, _freio;
static bool _freioMotor = true;

public override void OnInitializeMelon()
{
    _painel = Paineis.Criar("MeuMod", "Freios", "Freios", "Ctrl+Alt+F5")
        .Valor("Pressão", () => $"{_pressao:0.0} bar")
        .Barra("Freio", () => _freio)
        .Chave("Freio motor", () => _freioMotor, v => _freioMotor = v)
        .Botao("Zerar", Zerar);
}

static void Zerar() { _freio = 0f; }
```

Chamar `Criar` de novo com o mesmo mod e id devolve o painel que já existe. `Abrir()`, `Fechar()` e `Alternar()` controlam a janela pelo código, e `Aberto` diz se ela está na tela.

Duas propriedades mudam onde e como a janela aparece:

- `Largura`: em pixels de uma tela 1920×1080. O padrão é 440.
- `Direita = true`: abre no canto superior direito, abaixo dos cartões de HUD, em vez do esquerdo. Serve para ter uma janela de ferramenta e um inspetor lado a lado.

A altura acompanha o conteúdo. Quando ele passa do pé da tela, o corpo da janela rola e o título fica parado no topo.

## O que vai num painel

| Item | Para |
|---|---|
| `Secao(titulo)` | título de grupo |
| `Texto(() => ...)` | texto corrido, que quebra linha |
| `Valor(rotulo, () => ...)` | rótulo à esquerda e valor à direita |
| `Barra(rotulo, () => 0..1)` | barra de progresso, com texto opcional ao lado |
| `Chave(rotulo, ler, mudar)` | liga e desliga |
| `Faixa(rotulo, ler, mudar, min, max)` | controle deslizante |
| `Botao(rotulo, acao)` | um botão numa linha com rótulo |
| `Botoes((rotulo, acao), ...)` | fileira de botões de mesma largura, para a barra de ações de uma ferramenta |
| `Campo` e `CampoNumero` | texto e número digitados (veja abaixo) |
| `Busca` e `Lista` | lista rolável com filtro (veja abaixo) |
| `Preferencia(entrada)` | uma preferência do mod, com o controle do tipo dela |

As funções de leitura (`() => ...`) rodam a cada quadro enquanto o painel está aberto, então devem só ler valores que o mod já guardou. Procurar objetos na cena dentro delas pesa no jogo inteiro. Se uma delas lançar exceção, o item mostra `—`, o erro vai para o log e o resto do painel continua funcionando.

Cada item adicionado remonta a janela. Monte o painel uma vez e deixe o que muda para as funções de leitura, em vez de chamar `Valor` ou `Texto` de novo a cada atualização.

## Campos

`Campo` mostra o valor atual enquanto não está em edição e só chama `mudar` quando o jogador confirma (Enter ou clique fora) e o texto mudou. Com a função de validação, um texto que devolve mensagem não é aplicado, e a mensagem aparece junto do campo:

```csharp
.Campo("Apelido", () => _apelido, v => _apelido = v, "aparece no letreiro",
    s => s.Length > 12 ? "Até 12 letras" : null)
.CampoNumero("Limite", () => _limite, v => _limite = v, "0", "km/h", 10f, 120f);
```

`CampoNumero` aceita ponto ou vírgula decimal e recusa valores fora da faixa com uma mensagem no próprio campo. Enquanto um campo tem foco, os atalhos e o teclado do jogo ficam parados, então digitar "W" não acelera o ônibus.

## Listas e busca

`Lista` é uma caixa rolável de altura fixa, relida a cada 0,1 s. As linhas entram e saem sem remontar o painel. Um clique chama `escolher` com o item da linha, `selecionado` destaca as linhas escolhidas e `detalhe` dá uma segunda linha de texto. `Busca` avisa a cada letra, o que permite filtrar a lista enquanto se digita:

```csharp
.Busca("Buscar por nome", s => _filtro = s ?? "")
.Lista(() => _rotas.Where(r => r.Nome.Contains(_filtro)).ToList(), r => r.Nome, r => _escolhida = r,
    r => r == _escolhida, r => $"{r.Nos} nós", 300f, "Nenhuma rota", compacta: true);
```

`compacta: true` deixa as linhas com 40 px, melhor para listas longas.

## Mostrar só em certos casos

Os itens entre `Se(condição)` e `FimSe()` só aparecem enquanto a condição é verdadeira. É assim que um inspetor acompanha a seleção:

```csharp
.Se(() => _escolhida == null).Texto(() => "Escolha uma rota na lista.").FimSe()
.Se(() => _escolhida != null)
    .Valor("Rota", () => _escolhida.Nome)
    .Botoes(("Focar", () => { }), ("Apagar", () => { }))
.FimSe();
```

Os blocos não se aninham: um `Se` novo substitui o anterior. Quando duas condições valem juntas, junte-as numa só (`() => _escolhida != null && _avancado`).

## Abas e seções recolhíveis

`Abas` põe uma fileira de abas no painel, com a ativa destacada. O mod diz qual está ativa e recebe o índice da aba clicada. Os rótulos são lidos a cada quadro, então podem levar contadores. `SecaoRecolhivel` é um título com seta que abre e fecha com um clique. Nenhuma das duas esconde itens por conta própria: o conteúdo de cada aba ou seção vai num `Se` com a mesma condição.

```csharp
var p = Paineis.Criar("MeuMod", "Editor", "Editor")
    .Abas(() => _aba, i => _aba = i, () => "Mapa", () => $"Rotas {_rotas.Count}")
    .Se(() => _aba == 1)
        .Lista(() => _rotas, r => r.Nome, r => _escolhida = r)
    .FimSe()
    .SecaoRecolhivel("Avançado", () => _avancado, v => _avancado = v)
    .Se(() => _avancado)
        .Chave("Freio motor", () => _freioMotor, v => _freioMotor = v)
    .FimSe();
p.Direita = true;
```

Guarde o estado das abas e das seções numa preferência do mod se quiser que ele volte igual na próxima vez que o jogo abrir.

A lista completa de membros, com os parâmetros opcionais, está na [referência de `Painel`](/pbs-loader-docs/referencia/pbsloadercommoninterface/painel/).
