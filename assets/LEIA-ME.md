# Assets da Mine

Estrutura de pastas para você ir soltando os arquivos reais.
O site já está preparado para usá-los.

```
assets/
├── favicon.svg        ← ícone da aba (já criado)
├── logo/              ← coloque aqui as PNGs oficiais da logo
│   ├── mine-preto.png       (wordmark preto)
│   ├── mine-creme.png       (wordmark creme/claro)
│   ├── m-preto.png          (monograma preto)
│   └── m-creme.png          (monograma creme)
├── videos/            ← reels verticais (.mp4) p/ o portfólio
│   ├── projeto-01.mp4
│   └── ...
├── posters/           ← 1ª frame de cada vídeo (.jpg) p/ carregar rápido
│   ├── projeto-01.jpg
│   └── ...
└── clients/           ← logos dos clientes (.svg ou .png fundo transparente)
    ├── cliente-01.svg
    └── ...
```

## Como adicionar um VÍDEO no portfólio
No `index.html`, dentro do card desejado, preencha o `<video>`:
```html
<video class="reel__video" muted loop playsinline preload="none"
       data-src="assets/videos/projeto-01.mp4"
       poster="assets/posters/projeto-01.jpg"></video>
```
O vídeo carrega e dá play (mudo) sozinho quando entra na tela.

**Dica de performance:** exporte os reels em ~1080×1920, H.264, e tente
manter cada arquivo abaixo de ~5 MB (use HandBrake se precisar comprimir).

## Como adicionar uma LOGO de cliente
Troque o `<span class="client__name">Cliente Exemplo</span>` por:
```html
<img src="assets/clients/cliente-01.svg" alt="Nome do Cliente" loading="lazy" />
```

## Logo oficial (PNG)
Quando subir as PNGs em `assets/logo/`, me avise que eu troco a logo
de texto atual pelas imagens oficiais no cabeçalho e no rodapé.
