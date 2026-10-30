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

## Publicação

Cada push no `main` roda `.github/workflows/deploy.yml`, que gera o site e publica no GitHub Pages. Em Settings > Pages do repositório, a fonte precisa estar em "GitHub Actions".

## Para assistentes de IA

O build gera `llms.txt`, `llms-full.txt` e `llms-small.txt` na raiz do site, e uma versão `.md` de cada página (a URL da página com `.md` no lugar da barra final).

## Licença

O texto da documentação está sob [CC BY 4.0](LICENSE).
