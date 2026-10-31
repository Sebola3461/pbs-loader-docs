---
title: Boas práticas
description: Onde ler e onde mudar cada coisa do jogo, e os erros comuns que derrubam o jogo, brigam com outros mods ou pesam no desempenho.
sidebar:
  order: 1
---

O jogo, o SDK e os outros mods dividem o mesmo processo, o mesmo cursor, o mesmo teclado e o mesmo ônibus. A maior parte dos problemas de um mod vem de mexer nessas coisas fora do lugar certo. Esta página junta as regras e mostra, caso a caso, o que evitar e o que fazer.

Os trechos são partes de uma classe `MelonMod` (ou de um script, no fim da página) e usam estes namespaces:

```csharp
using MelonLoader;
using PBSLoaderCommonUtils;             // Sdk, Ganchos, Dados, Salvos, Gaveta
using PBSLoaderCommonUtils.Conteudo;    // ScriptDeOnibus, ScriptDeMapa, Pacote
using PBSLoaderCommonUtils.Entrada;     // Atalhos, Mouse, Teclado
using PBSLoaderCommonUtils.Interface;   // Avisos, Gravidade
using PBSLoaderCommonUtils.Midia;       // Carregar
using PBSLoaderCommonUtils.Mundo;       // Trafego
using PBSLoaderCommonUtils.Partida;     // Vista, Opcoes
using PBSLoaderCommonUtils.Veiculos;    // Veiculo, Conducao, Comandos, PedidoDePorta
using UnityEngine;
```

## Onde fazer cada coisa

| Para | Use | Onde |
|---|---|---|
| ler velocidade, motor, pedais, luzes, portas | [`Veiculo`](/pbs-loader-docs/referencia/pbsloadercommonutils/veiculos/veiculo/) | `OnUpdate` ou `Sdk.Quadro`, depois de conferir `Veiculo.Existe` |
| mexer em motor, câmbio ou pneus | [`Ganchos.DepoisDaFisica`](/pbs-loader-docs/referencia/pbsloadercommonutils/ganchos/) | dentro do gancho, sem alocar memória |
| mudar a força de frenagem | `Ganchos.AntesDosFreios` | dentro do gancho |
| acelerar, frear ou esterçar pelo mod | [`Conducao`](/pbs-loader-docs/referencia/pbsloadercommonutils/veiculos/conducao/) | `OnUpdate`, a cada quadro enquanto quiser o controle |
| engatar marcha | `Comandos.Marcha` (automático) ou `Conducao.Marcha` (manual) | uma vez no automático; a cada quadro no manual |
| abrir uma porta | `Comandos.Porta` | quando quiser |
| impedir que uma porta abra | `Ganchos.PortaPedida` com `Cancelar` | dentro do gancho |
| posicionar a câmera | `Vista.Assumir` | a cada quadro em que a câmera é sua |
| soltar ou prender o cursor | `Mouse.Soltar` e `Mouse.Prender` | a cada quadro |
| reagir a uma tecla | `Atalhos.Registrar` | uma vez, no `OnInitializeMelon` |
| digitar num painel sem acionar o jogo | `Teclado.SuspenderJogo` | a cada quadro com o campo aberto |
| mostrar um estado na tela | `Avisos.Definir` | quando o estado mudar, ou a cada quadro |
| avisar de um acontecimento | `Avisos.Notificar` | uma vez, no momento do acontecimento |
| passar um valor para outro mod | [`Dados`](/pbs-loader-docs/referencia/pbsloadercommonutils/dados/) | quando o valor mudar |
| guardar algo para a próxima sessão | [`Salvos`](/pbs-loader-docs/referencia/pbsloadercommonutils/salvos/) | ao mudar; o SDK grava o arquivo sozinho |
| carregar textura, som ou modelo | `Carregar.Textura`, `Carregar.Som`, `Carregar.Modelo` | uma vez, e guarde o resultado |
| ver carros e semáforos | `Trafego.Veiculos`, `Trafego.Semaforos` | só enquanto a função do mod está ligada |
| mudar uma opção do jogo | `Opcoes` | só quando o valor for diferente |

## Ler o jogo só na thread principal

Evite:

```csharp
Task.Run(async () =>
{
    while (true)
    {
        _velocidade = Veiculo.VelocidadeKmh;   // fora da thread principal
        await Task.Delay(100);
    }
});
```

Faça:

```csharp
public override void OnUpdate()
{
    if (!Veiculo.Existe) return;
    _amostra = new Amostra(Veiculo.VelocidadeKmh, Veiculo.Motor.Rpm);
}

readonly record struct Amostra(float VelocidadeKmh, float Rpm);
```

O jogo é IL2CPP, e o coletor de lixo dele não conhece threads criadas pelo mod. Tocar num objeto da Unity, do jogo ou do SDK fora da thread principal derruba o jogo, às vezes minutos depois e sem mensagem no log. Se o mod precisa de trabalho pesado em outra thread (gravar telemetria, calcular algo demorado), copie os valores para tipos comuns do C#, como a `Amostra` acima, e passe essa cópia adiante.

## Conferir se o ônibus existe

Evite:

```csharp
public override void OnUpdate()
{
    if (Veiculo.VelocidadeKmh < 1f)
        Avisos.Definir("MeuMod", "parado", true, Gravidade.Info, "Ônibus parado");
}
```

Faça:

```csharp
public override void OnUpdate()
{
    if (!Veiculo.Existe) return;
    Avisos.Definir("MeuMod", "parado", Veiculo.Parado, Gravidade.Info, "Ônibus parado");
}
```

No menu e nas telas de escolha não há ônibus, e o SDK devolve o valor padrão em vez de lançar exceção: `VelocidadeKmh` vale 0. O primeiro código conclui que o ônibus está parado quando não há ônibus nenhum. Confira `Veiculo.Existe`, `Mapa.Existe` ou `Sdk.Fase` antes de usar os números.

## Pedidos que valem por quadro

`Conducao`, `Mouse`, `Teclado.SuspenderJogo` e `Vista.Assumir` funcionam do mesmo jeito: o pedido vale enquanto for repetido. Quando o mod para de pedir, o controle volta ao jogador ou a quem mais estiver pedindo, no quadro seguinte. Assim, um mod que trava ou é desligado nunca deixa o pedal preso ou o cursor solto.

Evite:

```csharp
Sdk.MapaCarregou += () => Conducao.Freio("MeuMod", 1f);   // vale só para um quadro
```

Faça:

```csharp
public override void OnUpdate()
{
    if (!Veiculo.Existe) return;
    if (_limitadorLigado && Veiculo.VelocidadeKmh > 60f)
        Conducao.Acelerador("MeuMod", 0f);   // repetido a cada quadro acima de 60 km/h
}
```

Com dois mods pedindo o mesmo pedal, vale o maior no freio e no freio de mão e o último pedido nos outros. `Conducao.Donos` diz quem está pedindo.

O câmbio tem uma exceção. No automático, `Comandos.Marcha(1)` põe em D, e o jogo mantém a posição. No manual, o jogo reverte a marcha a cada quadro, então use `Conducao.Marcha("MeuMod", 2)` repetido enquanto quiser aquela marcha.

## Cursor e teclado

Evite:

```csharp
Cursor.lockState = CursorLockMode.None;
Cursor.visible = true;
```

Faça:

```csharp
public override void OnUpdate()
{
    Mouse.Soltar("MeuMod", _painelAberto);
    Teclado.SuspenderJogo("MeuMod", _campoDeTextoAtivo);
}
```

O cursor é um só para o jogo e todos os mods. Quem mexe direto em `Cursor.lockState` briga com a câmera do jogo e com os outros mods, e o resultado mais comum é o cursor preso no meio da tela com um painel aberto. Com `Mouse`, solto ganha de preso, e quando ninguém pede, o cursor volta a ser do jogo.

`Teclado.SuspenderJogo` desliga os controles de teclado do jogo enquanto o seu painel precisa das teclas, para a buzina não tocar enquanto o jogador digita. Num campo de texto da Unity com foco, o SDK já faz isso sozinho.

## Teclas: registre um atalho

Evite:

```csharp
if (Input.GetKeyDown(KeyCode.H)) _painelAberto = !_painelAberto;
```

Faça:

```csharp
public override void OnInitializeMelon()
{
    Atalhos.Registrar("MeuMod", "Painel", "Painel do MeuMod", "Ctrl+Alt+Home", () => _painelAberto = !_painelAberto);
}
```

O jogo usa quase todas as letras, os números, as setas e boa parte do teclado numérico, e alguns scripts dele ignoram Ctrl e Alt. O `H` do primeiro exemplo também aciona um comando do jogo. Um atalho registrado aparece na página **Atalhos** da PBSLoaderCommonInterface, onde o jogador troca a tecla e vê conflitos com o jogo e com outros mods, e não dispara enquanto ele digita num campo de texto. Ficam livres F2, F3, F9 a F12, Home, Insert, Delete, PgUp e PgDn, mas os mods do catálogo já usam Ctrl+Alt com F2, F3 e F9 a F12. Prefira combinações com Home, Insert, Delete, PgUp ou PgDn.

O primeiro argumento é o Identifier da categoria de preferências do seu mod. É por ele que a interface junta os atalhos na página do mod.

## Câmera

Evite escrever um patch Harmony no `MouseOrbitCSHARP.Update` do jogo para mover a câmera.

Faça:

```csharp
public override void OnLateUpdate()
{
    Vista.Assumir("MeuMod", _cameraLivreLigada);
    if (_cameraLivreLigada && Vista.Camera != null)
        Vista.Camera.transform.position = _posicaoDaCamera;
}
```

Enquanto algum mod pede, a câmera orbital do jogo não roda. Dois mods com patch próprio no mesmo método disputam a câmera a cada quadro.

## Ganchos de física: rápido e sem alocar

Os ganchos de física rodam dezenas de vezes por segundo, dentro do passo de física do jogo. Cada alocação ali vira trabalho para o coletor de lixo, e o resultado são travadas a cada poucos segundos.

Evite:

```csharp
Ganchos.DepoisDaFisica += vpp =>
{
    _historico.Add(Veiculo.Motor.Rpm);                // a lista cresce sem parar
    LoggerInstance.Msg($"rpm {Veiculo.Motor.Rpm}");   // texto novo e escrita em disco a cada passo
};
```

Faça:

```csharp
readonly float[] _rpm = new float[256];
int _posicao;

public override void OnInitializeMelon()
{
    Ganchos.DepoisDaFisica += vpp =>
    {
        _rpm[_posicao] = Veiculo.Motor.Rpm;
        _posicao = (_posicao + 1) % _rpm.Length;
    };
}
```

Mexa no motor, no câmbio e nos pneus em `DepoisDaFisica`, e não no `OnUpdate`. O `OnUpdate` roda uma vez por quadro desenhado, a física roda num ritmo fixo, e uma mudança feita no lugar errado é sobrescrita pelo próximo passo. O argumento do gancho é o componente do jogo (`VPVehicleController`), e os campos dele podem mudar entre versões. Os ganchos só disparam para o veículo do jogador, nunca para o tráfego.

## Avisos: condição ou acontecimento

Evite:

```csharp
public override void OnUpdate()
{
    if (_pressaoDoOleo < 1f)
        Avisos.Notificar("MeuMod", "oleo", Gravidade.Falha, "Pressão do óleo baixa");   // recria o aviso a cada quadro
}
```

Faça:

```csharp
public override void OnUpdate()
{
    if (!Veiculo.Existe) return;
    Avisos.Definir("MeuMod", "oleo", _pressaoDoOleo < 1f, Gravidade.Falha, "Pressão do óleo baixa", $"{_pressaoDoOleo:0.0} bar");
}

void AoSalvarAjustes() => Avisos.Notificar("MeuMod", "salvo", Gravidade.Info, "Ajustes salvos");
```

`Definir` é para uma condição: o aviso fica na tela enquanto ela vale e sai quando você passa `false`. `Notificar` é para um acontecimento: aparece uma vez e some sozinho depois de alguns segundos. Trocar de veículo limpa todos os avisos.

## Trocar dados com outro mod

Evite referenciar a DLL de outro mod para ler um campo estático dele. Se o outro mod não estiver instalado, o seu deixa de carregar, e qualquer mudança interna nele quebra o seu.

Faça:

```csharp
// no mod que publica
Dados.Publicar("MeuMod", "temperaturaOleo", _temperatura);

// no mod que lê, sem depender da DLL do primeiro
float temperatura = Dados.Ler("MeuMod", "temperaturaOleo", 0f);
```

O valor publicado vale até o veículo trocar. Com `porVeiculo: false`, vale até o jogo fechar.

## Salvar entre sessões

Evite gravar arquivo a cada quadro ou chamar `Salvos.GravarAgora()` em todo `OnUpdate`.

Faça:

```csharp
Gaveta _gaveta;

public override void OnInitializeMelon()
{
    Sdk.VeiculoTrocou += () => _gaveta = Veiculo.Existe ? Salvos.DoOnibus("MeuMod") : null;
}

void AoTerminarViagem(float km)
{
    if (_gaveta == null) return;
    _gaveta.Gravar("km", _gaveta.Ler("km", 0f) + km);
}
```

`Gravar` só marca a gaveta. O arquivo é escrito 1,5 segundo depois da última mudança, na troca de cena e quando o jogo fecha. Pegue a gaveta de novo a cada troca de ônibus (`Salvos.DoOnibus`) ou de mapa (`Salvos.DoMapa`), porque cada ônibus tem a sua.

## Texturas, sons e modelos

Evite:

```csharp
public override void OnGUI()
{
    var icone = Carregar.Textura(_caminhoDoIcone);   // lê o arquivo de novo a cada quadro
    GUI.DrawTexture(new Rect(10, 10, 64, 64), icone);
}
```

Faça:

```csharp
Texture2D _icone;

public override void OnInitializeMelon() => _icone = Carregar.Textura(_caminhoDoIcone);

public override void OnGUI()
{
    if (_icone != null) GUI.DrawTexture(new Rect(10, 10, 64, 64), _icone);
}
```

O que o mod carrega não some quando o jogo troca de ônibus. Quando não precisar mais de um recurso, destrua com `UnityEngine.Object.Destroy`. Um erro de carregamento volta `null` e uma linha no log.

Para trocar a textura de uma peça do ônibus do jogador, use `Veiculo.Objetos.TrocarTextura`. Ele muda só as instâncias de material daquele ônibus. Mexer direto no `sharedMaterial` de um renderizador muda também os ônibus do tráfego que usam o mesmo modelo.

## Tráfego: leia só quando precisar

`Trafego.Veiculos`, `Trafego.PedestresAtivos` e `Trafego.Semaforos` varrem a cena uma vez por segundo, e só enquanto algum mod lê essas listas. Ler "por garantia", com a função do mod desligada, faz o SDK continuar varrendo à toa.

```csharp
public override void OnUpdate()
{
    if (!Veiculo.Existe || !_radarLigado) return;
    var frente = Trafego.MaisPertoAFrente(80f);
    _distanciaAFrente = frente != null ? frente.DistanciaM : float.PositiveInfinity;
}
```

## Opções do jogo

Gravar uma opção escreve o `settings.txt` do jogo na hora. Evite atribuir o valor a cada quadro. Confira antes:

```csharp
if (Opcoes.CarrosNoTransito.Valor != 40) Opcoes.CarrosNoTransito.Valor = 40;
```

## Patch Harmony próprio

Prefira um [gancho](/pbs-loader-docs/referencia/pbsloadercommonutils/ganchos/). Se o SDK ainda não tem o ponto que você precisa, peça no repositório do PBSU Loader. Se fizer o patch mesmo assim, fique parado no modo seguro, porque numa versão do jogo que não foi testada o método pode ter mudado:

```csharp
public override void OnInitializeMelon()
{
    if (!Sdk.Requer("2.0", "MeuMod")) return;
    if (Sdk.ModoSeguro) return;   // versão do jogo não testada: não aplique patches
    HarmonyInstance.PatchAll();
}
```

## Exceções

Uma exceção no `OnUpdate` se repete a cada quadro e enche o log. Envolva a parte arriscada com `Sdk.Seguro`, que registra no máximo uma vez a cada 10 segundos por nome:

```csharp
public override void OnUpdate() => Sdk.Seguro(AtualizarPainel, "MeuMod.painel");
```

Os eventos do SDK já fazem isso com os inscritos.

## Scripts de ônibus e de mapa

As mesmas regras valem, com três cuidados a mais:

```csharp
public class MeuScript : ScriptDeOnibus
{
    public override void Ativar()
    {
        Ganchos.PortaPedida += AoPedirPorta;
        var som = Pacote.Som("sons/aviso.wav");   // arquivo da pasta do pacote
    }

    public override void Desativar()
    {
        Ganchos.PortaPedida -= AoPedirPorta;      // a inscrição não sai sozinha
    }

    void AoPedirPorta(PedidoDePorta pedido)
    {
        if (pedido.Abrindo && Veiculo.VelocidadeKmh > 3f) pedido.Cancelar(Pacote.Id);
    }
}
```

- Saia em `Desativar` de todo evento em que entrou em `Ativar`. Senão, o script continua reagindo com outro ônibus em jogo.
- Use `Pacote.Harmony` para patches. A PBSLoaderCommonUtils desfaz esses patches quando o pacote desativa, e um `new Harmony(...)` próprio ficaria aplicado.
- Leia arquivos com `Pacote.Caminho`, `Pacote.LerTexto`, `Pacote.Textura` e os outros métodos do pacote. Eles não saem da pasta do pacote, e o mesmo script funciona onde quer que o jogador tenha posto o ônibus.
