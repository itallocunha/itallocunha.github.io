# Portfólio Itallo Cunha

Site-portfólio de Itallo Cunha: game design, design gráfico, ilustração e ensino.

## Estrutura

- `index.html` · landing page
- `ilustracao.html`, `design-grafico.html`, `pixel-art.html`, `modelagem-3d.html`, `ia.html`, `jogos.html`, `ensino.html` · páginas de cada área
- `area.css` / `area.js` · visual e lógica das páginas de área
- `textos-portfolio.json` · títulos e descrições de áreas e atividades
- `gerar-galeria.py` · lê as pastas de artes em `assets/`, gera as versões leves em `assets/_web` e o `assets/manifesto.js`
- `aulas/` · uma página dedicada para cada ferramenta que ensino (blog + galeria)
  - `aulas/dados.js` · lista das ferramentas (nome, ícone, resumo), usada pelo menu e pela landing
  - `aulas/aula.css` / `aulas/aula.js` · visual e montagem das páginas de aula
  - `aulas/<ferramenta>/index.html` · página da ferramenta (python, pixel-art, level-design, gdevelop, unity, godot, scratch, canva, ia)
  - `aulas/<ferramenta>/conteudo.js` · textos, posts do diário e lista de mídia (edite aqui)
  - `aulas/<ferramenta>/midia/` · imagens e vídeos daquela ferramenta
- `assets/icones/` · ícones em pixel art das ferramentas (usados na landing e nas páginas de aula)
- `assets/infinity-run.js` · mini-jogo "Infinity Run" da seção de contato (canvas + som sintetizado, sem imagens ou áudios externos; o HTML/CSS dele está em `index.html`, no bloco `#jogo`)
- `assets/` · imagens do site

## Atualizar as galerias

```
pip install pillow
python gerar-galeria.py
```

As artes originais em alta resolução ficam fora do repositório (veja `.gitignore`); o site usa as versões otimizadas de `assets/_web`.

## Alimentar uma página de aula

1. Coloque as imagens/vídeos em `aulas/<ferramenta>/midia/` (prefira `.webp` ou `.jpg` leves).
2. Em `aulas/<ferramenta>/conteudo.js`, adicione o arquivo em `midia` e novos textos em `posts`.
3. Suba para o GitHub incluindo a pasta `midia`. O arquivo `.nojekyll` na raiz precisa continuar lá.

## Adicionar um novo projeto ou continuação

- **Nova área do portfólio** (ex.: um novo tipo de arte): crie o `.html` copiando um existente (`design-grafico.html`), ajuste `data-area`, e cadastre a área em `textos-portfolio.json` + `gerar-galeria.py`. Depois inclua o card correspondente em `index.html` (seção `PORTFÓLIO`).
- **Projeto próprio com página dedicada** (como `Althea site/` e `O copo não parou/`): crie uma pasta com seu `index.html` e coloque os arquivos dela dentro. Use vídeos de fundo sempre com `poster`, em versão leve para celular (`-640.mp4`) e em `object-fit: cover` apenas quando a proporção da tela combinar com a do vídeo.
- **Links pendentes**: o link do Behance em `index.html` está oculto (atributo `hidden`). Coloque a URL e remova o atributo.
- **Imagens ainda faltando**: `assets/port-03-pixelart.png` (card Pixel Art) e `assets/port-07-ensino.png` (card Ensino). Enquanto não existirem, o espaço fica vazio.
