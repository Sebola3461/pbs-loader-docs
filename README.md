# PBSU Loader SDK: documentação

Site da documentação do SDK de mods do Proton Bus Simulator Urbano (PBSLoaderCommonUtils), publicado em <https://sebola3461.github.io/pbs-loader-docs/>. O código do SDK fica no repositório [pbsu-loader](https://github.com/Sebola3461/pbsu-loader).

O site usa [Starlight](https://starlight.astro.build/). As páginas são arquivos Markdown em `src/content/docs/`.

## Rodar localmente

Precisa do Node 22.22 ou mais novo (o CI usa o 24).

```
npm ci
npm run dev       # servidor em http://localhost:4321/pbs-loader-docs/
npm run build     # gera o site em dist/
```

## Referência da API

As páginas em `src/content/docs/referencia/` são geradas e ficam fora do git. A fonte é o `<Biblioteca>.api.json` que o `release.ps1` do pbsu-loader anexa a cada release da PBSLoaderCommonUtils e da PBSLoaderCommonInterface.

```
npm run reference                                   # baixa do release mais novo de cada biblioteca
$env:PBS_API_DIR = "L:\pbs_dump\pbsu-loader\dist"   # ou usa os arquivos de um release.ps1 local
npm run reference
```

Um release estável tem preferência sobre uma versão de teste mais nova. O script confere o SHA-256 que o GitHub publica para o asset. Com `--strict`, ele falha se faltar alguma biblioteca. Para mudar o texto de um tipo ou membro, edite o comentário `///` no código do pbsu-loader e publique um release novo.

## Testes

```
npm test
npm run test:coverage
```

## Publicação

Cada push no `main` roda `.github/workflows/deploy.yml`: testes, referência, build e publicação no GitHub Pages. Em Settings > Pages do repositório, a fonte precisa estar em "GitHub Actions". Depois de um release do pbsu-loader, rode o workflow à mão (`gh workflow run deploy.yml -R Sebola3461/pbs-loader-docs`) para o site pegar a API nova.

## Para assistentes de IA

O build gera `llms.txt`, `llms-full.txt` e `llms-small.txt` na raiz do site, e uma versão `.md` de cada página (a URL da página com `.md` no lugar da barra final).

## Licença

O texto da documentação está sob [CC BY 4.0](LICENSE).
