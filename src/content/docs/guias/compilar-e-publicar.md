---
title: Compilar e publicar
description: "Do código C# ao catálogo: montar o projeto, compilar a DLL, publicar a release no GitHub e enviar o mod para o catálogo da comunidade."
sidebar:
  order: 2
---

Esta página leva um [mod global](/pbs-loader-docs/conceitos/tipos-de-mod/) do código-fonte até o catálogo da comunidade, de onde o instalador e o site dos mods o distribuem. Um script de ônibus ou de mapa compila do mesmo jeito; só muda onde a DLL vai depois, e a seção no fim da página explica a diferença.

Antes de escrever o código, leia [Como o PBSLoader funciona](/pbs-loader-docs/conceitos/como-funciona/) para conhecer as peças, e depois [Boas práticas](/pbs-loader-docs/guias/boas-praticas/) para escrever um mod que não derruba o jogo.

## O que você precisa

| Item | Para quê |
|---|---|
| O jogo 307 com o PBSLoader instalado, aberto pelo menos uma vez | o build lê as DLLs que o MelonLoader gera em `MelonLoader\Il2CppAssemblies` no primeiro boot; o [instalador](https://github.com/Sebola3461/pbsu-loader) cria essa pasta ao abrir o jogo |
| .NET SDK 8 ou mais novo | compila o alvo `net6.0`, que é o que o MelonLoader 0.7.3 carrega |
| Conta no GitHub | guarda o código-fonte e publica a release com a DLL |
| Git e, para seguir os comandos da página, o GitHub CLI (`gh`) | criar o repositório e a release sem sair do terminal |

## O projeto

Um mod é uma biblioteca de classes com o alvo `net6.0`. A estrutura mínima:

```
MeuMod/
  MeuMod.csproj
  MeuMod.cs
  .gitignore          bin/ e obj/
```

O `.csproj` aponta para as DLLs do jogo, do MelonLoader e das duas bibliotecas do PBSLoader. Ajuste `GameDir` para a pasta onde o jogo está instalado:

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <!-- A pasta onde fica "Proton Bus Simulator.exe". -->
  <PropertyGroup>
    <GameDir>C:\Jogos\Proton Bus Simulator</GameDir>
    <MLDir>$(GameDir)\MelonLoader</MLDir>
    <Il2CppDir>$(MLDir)\Il2CppAssemblies</Il2CppDir>
  </PropertyGroup>

  <PropertyGroup>
    <TargetFramework>net6.0</TargetFramework>
    <AssemblyName>MeuMod</AssemblyName>
    <RootNamespace>MeuMod</RootNamespace>
    <LangVersion>latest</LangVersion>
    <Nullable>disable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <!-- MelonLoader, Harmony e o runtime IL2CPP. -->
    <Reference Include="MelonLoader"><HintPath>$(MLDir)\net6\MelonLoader.dll</HintPath><Private>false</Private></Reference>
    <Reference Include="0Harmony"><HintPath>$(MLDir)\net6\0Harmony.dll</HintPath><Private>false</Private></Reference>
    <Reference Include="Il2CppInterop.Runtime"><HintPath>$(MLDir)\net6\Il2CppInterop.Runtime.dll</HintPath><Private>false</Private></Reference>
    <!-- O jogo e a Unity, expostos pelo IL2CPP na pasta criada no primeiro boot. -->
    <Reference Include="Il2Cppmscorlib"><HintPath>$(Il2CppDir)\Il2Cppmscorlib.dll</HintPath><Private>false</Private></Reference>
    <Reference Include="Assembly-CSharp"><HintPath>$(Il2CppDir)\Assembly-CSharp.dll</HintPath><Private>false</Private></Reference>
    <Reference Include="UnityEngine.CoreModule"><HintPath>$(Il2CppDir)\UnityEngine.CoreModule.dll</HintPath><Private>false</Private></Reference>
    <Reference Include="UnityEngine.IMGUIModule"><HintPath>$(Il2CppDir)\UnityEngine.IMGUIModule.dll</HintPath><Private>false</Private></Reference>
    <Reference Include="UnityEngine.InputLegacyModule"><HintPath>$(Il2CppDir)\UnityEngine.InputLegacyModule.dll</HintPath><Private>false</Private></Reference>
    <!-- As duas bibliotecas do PBSLoader, instaladas pelo instalador na pasta Mods do jogo. -->
    <Reference Include="PBSLoaderCommonUtils"><HintPath>$(GameDir)\Mods\PBSLoaderCommonUtils.dll</HintPath><Private>false</Private></Reference>
    <Reference Include="PBSLoaderCommonInterface"><HintPath>$(GameDir)\Mods\PBSLoaderCommonInterface.dll</HintPath><Private>false</Private></Reference>
  </ItemGroup>

</Project>
```

O `Private="false"` (Copy Local desligado) impede que essas DLLs sejam copiadas junto com a sua na pasta de saída: o jogo já tem todas. Adicione os outros módulos da Unity conforme usar (`UnityEngine.ImageConversionModule` para texturas, `UnityEngine.TextRenderingModule` para texto na tela e assim por diante); a lista está em `MelonLoader\Il2CppAssemblies`.

A identidade do mod vai no `MeuMod.cs`:

```csharp
using MelonLoader;
using PBSLoaderCommonUtils;

[assembly: MelonInfo(typeof(MeuMod.MeuModMod), "MeuMod", "1.0.0", "seu-apelido")]
[assembly: MelonGame(null, "Proton Bus Simulator")]
[assembly: MelonAdditionalDependencies("PBSLoaderCommonUtils", "PBSLoaderCommonInterface")]

namespace MeuMod
{
    public class MeuModMod : MelonMod
    {
        public override void OnInitializeMelon()
        {
            if (!Sdk.Requer("2.0", "MeuMod")) return;
        }
    }
}
```

- O nome do `MelonInfo` (`"MeuMod"`) é o `id` do mod no catálogo, e a versão é a que o jogador vê no log e no menu de mods.
- `MelonAdditionalDependencies` garante que as bibliotecas carreguem antes do seu mod. Liste também qualquer outro mod de que o seu dependa.
- `Sdk.Requer` deixa o mod parado, com um aviso ao jogador, quando o SDK instalado for velho demais; veja [`Sdk`](/pbs-loader-docs/referencia/pbsloadercommonutils/sdk/).

## Compilar

```powershell
dotnet build -c Release
```

A DLL sai em `bin\Release\net6.0\MeuMod.dll`. Para testar, copie-a para a pasta `Mods` do jogo e abra o jogo:

```powershell
copy bin\Release\net6.0\MeuMod.dll "<pasta do jogo>\Mods"
```

Com o jogo aberto a DLL fica em uso e não dá para substituir: feche o jogo antes de recopiar. O que o MelonLoader carregou e as exceções do seu mod aparecem em `MelonLoader\Latest.log`, na pasta do jogo. Se o build reclamar de referência não encontrada, confira o caminho do `GameDir` e se o jogo já foi aberto pelo menos uma vez com o MelonLoader instalado — sem o primeiro boot, a pasta `Il2CppAssemblies` não existe.

## Publicar a release

O instalador e o site baixam a DLL de uma release do GitHub, então o mod precisa de um repositório público com a DLL anexada:

```powershell
git init -b main
git add .
git commit -m "MeuMod 1.0.0"
gh repo create MeuMod --public --source . --remote origin --push
gh release create MeuMod-v1.0.0 bin\Release\net6.0\MeuMod.dll --title "MeuMod 1.0.0" --notes "O que o mod faz."
```

Três regras:

- A **tag** tem um prefixo fixo que termina na versão (`MeuMod-v1.0.0`). O prefixo (`MeuMod-v`) é o que o catálogo guarda.
- O **nome do arquivo anexado** tem de ser exatamente o `arquivo` declarado no catálogo — no exemplo, `MeuMod.dll`. O catálogo aponta para o arquivo, e a validação confere o SHA-256 que o GitHub publica.
- Publique uma release **estável**, sem marcar pré-lançamento: o instalador só instala pré-lançamento para quem marcar "Incluir versões de teste" nas opções dele.

A versão da tag e a do `MelonInfo` devem dizer o mesmo, senão o jogador vê um número no instalador e outro no menu de mods.

## Entrar no catálogo

O catálogo da comunidade vive no repositório [pbs-loader-catalogo](https://github.com/Sebola3461/pbs-loader-catalogo), um arquivo JSON por mod. Há duas portas, com a mesma validação:

- **pelo site**: entre com sua conta e use a página **Enviar**. Preencha o repositório (`seu-login/MeuMod`), o prefixo da tag (`MeuMod-v`), o arquivo (`MeuMod.dll`), o tipo, as versões do jogo (`307`), a descrição e as dependências; capa e galeria são opcionais, e o site converte as imagens para WebP sozinho.
- **pelo GitHub**: faça um fork e crie `mods/MeuMod.json`:

```json
{
  "id": "MeuMod",
  "nome": "Meu Mod",
  "tipo": "plugin",
  "autor": "seu apelido",
  "dono": { "github": "seu-login-do-github" },
  "descricao": "O que o mod faz.",
  "versoesDoJogo": ["307"],
  "dependencias": [],
  "origem": { "github": { "repo": "seu-login/MeuMod", "tag": "MeuMod-v", "arquivo": "MeuMod.dll" } }
}
```

Se quiser uma capa, adicione `covers/MeuMod.webp`, com até 300 KB.

A Action do catálogo valida o PR e, se estiver tudo certo, faz o merge sozinha, regenera o catálogo publicado e o site é gerado de novo. Ela confere:

- um mod por PR, e só arquivos em `mods/` e `covers/`;
- o JSON no schema, com o `id` igual ao nome do arquivo e não usado por nenhum outro mod, nem do catálogo base;
- o `dono` é quem abre o PR — depois, só o dono (ou um moderador) edita ou remove o mod;
- a release existe, tem o arquivo declarado e o GitHub calculou o SHA-256 dele;
- cada dependência listada já existe no catálogo. As duas bibliotecas base já têm entrada; um mod que só depende delas pode deixar `dependencias` vazio.

O `tipo` diz o que o instalador faz com o mod: só `plugin` é instalado por enquanto. Os outros tipos (`onibus`, `mapa`, `skin`, `destino`, `som`, `outro`) aparecem no site com um link externo para baixar.

## Versão nova

Versão nova não precisa de PR: suba a versão no `MelonInfo`, compile e publique outra release com o mesmo prefixo (`MeuMod-v1.1.0`). O catálogo guarda só o prefixo, e o instalador encontra a release mais nova sozinho. Um PR (ou o formulário do site) serve para mudar a ficha do mod: descrição, capa, dependências.

## Scripts de ônibus e de mapa

Um script compila no mesmo projeto, com as mesmas referências — a diferença é o destino. A DLL vai na pasta `scripts/` do ônibus ou do mapa, dentro do pacote de conteúdo, e o SDK a carrega quando aquele conteúdo entra em jogo, pedindo permissão ao jogador na primeira vez. Ela não entra no catálogo: viaja junto do ônibus ou do mapa. O que o script pode fazer está em [`ScriptDeOnibus`](/pbs-loader-docs/referencia/pbsloadercommonutils/conteudo/scriptdeonibus/) e [`ScriptDeMapa`](/pbs-loader-docs/referencia/pbsloadercommonutils/conteudo/scriptdemapa/), e o arquivo do pacote se lê com `Pacote.Caminho` e os outros métodos de [`Pacote`](/pbs-loader-docs/referencia/pbsloadercommonutils/conteudo/pacote/).
