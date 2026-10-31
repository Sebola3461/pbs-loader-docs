---
title: Ciclo de uma partida
description: As fases do jogo, os eventos que o SDK dispara em cada uma e quando os dados do veículo e do mapa valem.
sidebar:
  order: 3
---

Um mod global fica carregado o jogo inteiro, mas os dados que ele usa só existem em parte desse tempo. Não há ônibus no menu, e o mapa só existe depois de carregado. [`Sdk.Fase`](/pbs-loader-docs/referencia/pbsloadercommonutils/fase/) diz em que ponto o jogador está.

## Fases

| Fase | O jogador está | O que já vale |
|---|---|---|
| `Menu` | no menu inicial | `Caminhos` (depois que o jogo define as pastas), `Opcoes` |
| `Selecao` | nas telas de escolha de ônibus, pintura, mapa e linha | `Sessao.Onibus`, `Sessao.Mapa` e a pintura, conforme ele escolhe |
| `Carregando` | na tela de carregamento | pouco: o veículo pode aparecer e ser trocado durante o carregamento |
| `Dirigindo` | na partida | `Veiculo`, `Mapa`, `Linha`, `Passageiros`, `Tempo`, `Clima`, `Trafego`, `Vista` |

Ao sair da partida, `Veiculo.Existe` e `Mapa.Existe` voltam a `false`, e `Sdk.VeiculoTrocou` dispara.

## Eventos

Os eventos do SDK rodam na thread principal, no mesmo quadro da mudança. Inscreva-se uma vez, no `OnInitializeMelon` do mod global ou no `Ativar` do script.

| Evento | Quando dispara |
|---|---|
| `Sdk.FaseMudou(Fase)` | a fase mudou |
| `Sdk.CenaCarregou(string)` | uma cena da Unity terminou de carregar, incluindo cada tile do mapa |
| `Sdk.VeiculoTrocou` | o veículo do jogador apareceu ou sumiu. Confira `Veiculo.Existe` |
| `Sdk.MapaCarregou` | um mapa novo começou |
| `Sdk.Quadro`, `Sdk.PassoFisico`, `Sdk.QuadroTardio` | todo Update, FixedUpdate e LateUpdate, depois dos dados do SDK |

Uma exceção no seu inscrito vai para o log, no máximo uma vez a cada 10 segundos, e não impede os outros inscritos de receber o evento.

```csharp
Sdk.VeiculoTrocou += () =>
{
    if (!Veiculo.Existe) return;
    LoggerInstance.Msg($"entrou no {Veiculo.Nome}, {Veiculo.Portas.Todas.Count} portas");
};
```

## Geração: estado por veículo e por mapa

`Veiculo.Geracao` e `Mapa.Geracao` são números que mudam a cada veículo e a cada mapa carregado. Durante o carregamento da partida, o jogo pode montar o veículo mais de uma vez, então `VeiculoTrocou` pode disparar mais de uma vez seguida.

Para guardar estado de um veículo (uma referência a uma porta, uma calibração, um objeto criado no ônibus), guarde a geração junto e reconstrua quando ela mudar:

```csharp
// using System.Linq;
int _geracao = -1;
Porta _portaDianteira;

public override void OnUpdate()
{
    if (!Veiculo.Existe) return;
    if (_geracao != Veiculo.Geracao)
    {
        _geracao = Veiculo.Geracao;
        _portaDianteira = Veiculo.Portas.Todas.FirstOrDefault(p => p.Numero == 1);
    }
    // ...
}
```

## Mapas em tiles

Mapas grandes carregam em pedaços (tiles) conforme o ônibus anda. `Mapa.Paradas` lista só os pontos dos tiles carregados agora, e um ponto sai da lista quando o tile dele descarrega. `Mapa.CarregandoTiles` fica `true` enquanto o jogo carrega um tile, e cada tile pronto dispara `Sdk.CenaCarregou` e, nos scripts de mapa, `TileCarregou(cena)`.

## Scripts de ônibus e de mapa

Os scripts seguem o ciclo do conteúdo deles, e não o do jogo:

1. Quando o ônibus vira o do jogador (ou o mapa carrega), a PBSLoaderCommonUtils lê o `pbsu.json`, confere o `sdkMinimo` e a permissão, carrega a DLL e chama `Ativar`.
2. Enquanto ele está em jogo, `Quadro`, `PassoFisico` e `QuadroTardio` rodam como os eventos do SDK.
3. Quando ele sai, ela chama `Desativar` e desfaz os patches do `Pacote.Harmony`. A DLL continua carregada até o jogo fechar.
4. Ao voltar para o mesmo ônibus ou mapa na mesma sessão, as mesmas instâncias são ativadas de novo, sem perguntar.

## Pausa e gravação

`Sessao.Pausado` fica `true` com o menu de pausa aberto. Confira essa propriedade se o seu mod não deve agir com o jogo pausado.

Os dados de [`Salvos`](/pbs-loader-docs/referencia/pbsloadercommonutils/salvos/) são gravados 1,5 segundo depois da última mudança, na troca de cena e quando o jogo fecha.
