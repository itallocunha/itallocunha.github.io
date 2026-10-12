# Portfólio Itallo Cunha

Site-portfólio de Itallo Cunha: game design, design gráfico, ilustração e ensino.

## Estrutura

- `index.html` · landing page
- `ilustracao.html`, `design-grafico.html`, `pixel-art.html`, `modelagem-3d.html`, `ia.html`, `jogos.html`, `ensino.html` · páginas de cada área
- `area.css` / `area.js` · visual e lógica das páginas de área
- `textos-portfolio.json` · títulos e descrições de áreas e atividades
- `gerar-galeria.py` · lê as pastas de artes em `assets/`, gera as versões leves em `assets/_web` e o `assets/manifesto.js`
- `assets/` · imagens do site

## Atualizar as galerias

```
pip install pillow
python gerar-galeria.py
```

As artes originais em alta resolução ficam fora do repositório (veja `.gitignore`); o site usa as versões otimizadas de `assets/_web`.
