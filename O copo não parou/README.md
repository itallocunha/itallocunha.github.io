# O Copo Não Parou — site de vendas

Página do jogo, aberta pelo botão "Conhecer o projeto" da seção *Projeto em destaque* do portfólio (`../index.html`).

## Estrutura

- `index.html` · a página inteira (abertura, caso, kit, envelopes, evidências, oferta, FAQ)
- `css/style.css` · visual (paleta e fontes do Guia de Produção do jogo)
- `js/main.js` · abertura animada, lightbox das evidências, barra de compra no celular
- `js/config.js` · **preço e link de compra** (edite só este arquivo)
- `img/` · todas as imagens, já otimizadas em webp

## Antes de divulgar

1. Em `js/config.js`, confirme o `price` e cole o `checkoutUrl` (Hotmart, Kiwify, etc.). Com o link vazio, o botão mostra "Vendas abrem em breve".
2. As artes originais em alta e os PDFs do jogo (incluindo manual do anfitrião e finais) **não** estão nesta pasta de propósito: o repositório do portfólio é público e eles têm spoilers.
3. Contato e Instagram do projeto também entram pelo `config.js` (opcionais).
