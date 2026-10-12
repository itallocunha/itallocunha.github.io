"""
GERADOR DA GALERIA DO PORTFÓLIO
================================
Lê as pastas dentro de /assets, cria versões leves das imagens (WebP) em
assets/_web e gera o arquivo assets/manifesto.js que as páginas de área usam.

Como usar (na pasta do site):
    pip install pillow
    python gerar-galeria.py

Rode de novo sempre que adicionar, remover ou renomear artes.

Regras das pastas:
  assets/<Pasta da área>/<Atividade>/            artes de apresentação (em ordem)
  assets/<Pasta da área>/<Atividade>/ARTE/       artes em alta para o carrossel
  Imagens soltas na pasta da área viram uma atividade própria.

Ordem: os arquivos seguem a ordem "natural" do nome (2 vem antes de 10).
Para forçar uma ordem, comece o nome com número: "1 - capa.png", "2 - ...".
Títulos e textos de cada área/atividade ficam em textos-portfolio.json.
"""
import hashlib, json, os, re, sys, unicodedata
from PIL import Image, ImageOps

AQUI = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(AQUI, "assets")
SAIDA = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else os.path.join(AQUI, "assets")
TEXTOS = os.path.join(AQUI, "textos-portfolio.json")
EXT = (".png", ".jpg", ".jpeg", ".webp", ".gif")
PASTAS_ARTE = ("ARTE", "ARTES")

def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def natural(s):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)]

def legenda(nome):
    n = os.path.splitext(nome)[0]
    n = re.sub(r"^\s*\d+\s*[-_.)]*\s*", "", n)          # tira "1 - " do começo
    n = n.replace("_", " ").strip()
    if re.match(r"^(chatgpt image|captura de tela|screenshot|image|img|imagem)\b", n, re.I) or re.fullmatch(r"[\d\s()]*", n):
        return ""                                          # nome genérico: a página mostra "Arte 01"
    return n[:1].upper() + n[1:]

def imagens(pasta):
    if not os.path.isdir(pasta): return []
    return sorted([f for f in os.listdir(pasta) if f.lower().endswith(EXT)], key=natural)

def otimizar(origem, destino, lado_max, qualidade):
    if os.path.exists(destino) and os.path.getmtime(destino) >= os.path.getmtime(origem):
        with Image.open(destino) as im: return im.size
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    with Image.open(origem) as im:
        im = ImageOps.exif_transpose(im)
        if im.mode not in ("RGB", "RGBA"): im = im.convert("RGBA")
        im.thumbnail((lado_max, lado_max), Image.LANCZOS)
        im.save(destino, "WEBP", quality=qualidade, method=6)
        return im.size

def rel(p):  # caminho relativo ao site, sempre com "/"
    return "assets/" + os.path.relpath(p, SAIDA if p.startswith(SAIDA) else ASSETS).replace(os.sep, "/")

def processar_lista(pasta, arquivos, destino_dir, tipo):
    vistos, itens = set(), []
    for f in arquivos:
        orig = os.path.join(pasta, f)
        h = hashlib.md5(open(orig, "rb").read()).hexdigest()
        if h in vistos: continue                      # ignora arquivos repetidos
        vistos.add(h)
        base = slug(os.path.splitext(f)[0]) or h[:8]
        if tipo == "apresentacao":
            w, hh = otimizar(orig, os.path.join(destino_dir, base + ".webp"), 2000, 86)
            itens.append({"src": rel(os.path.join(destino_dir, base + ".webp")), "w": w, "h": hh,
                          "original": rel(orig), "legenda": legenda(f)})
        else:
            w, hh = otimizar(orig, os.path.join(destino_dir, "arte", base + ".webp"), 2400, 88)
            otimizar(orig, os.path.join(destino_dir, "arte", "mini", base + ".webp"), 420, 78)
            itens.append({"src": rel(os.path.join(destino_dir, "arte", base + ".webp")),
                          "mini": rel(os.path.join(destino_dir, "arte", "mini", base + ".webp")),
                          "w": w, "h": hh, "original": rel(orig), "legenda": legenda(f)})
    return itens

def main():
    textos = json.load(open(TEXTOS, encoding="utf-8"))
    manifesto = {"areas": []}
    for area in textos["areas"]:
        pasta_area = os.path.join(ASSETS, area["pasta"])
        dados = {k: v for k, v in area.items() if k != "atividades"}
        dados["atividades"] = []
        cfg_ativ = area.get("atividades", {})
        if os.path.isdir(pasta_area):
            grupos = []
            soltas = imagens(pasta_area)
            arte_raiz = next((os.path.join(pasta_area, d) for d in os.listdir(pasta_area)
                              if d.upper() in PASTAS_ARTE and os.path.isdir(os.path.join(pasta_area, d))), None)
            if soltas or arte_raiz:
                # imagens soltas: se houver texto "_raiz" no json vira uma atividade; senão cada arquivo solto vira uma
                if "_raiz" in cfg_ativ:
                    grupos.append(("_raiz", pasta_area, soltas, arte_raiz))
                else:
                    for f in soltas:
                        grupos.append((os.path.splitext(f)[0], pasta_area, [f], None))
            for d in sorted(os.listdir(pasta_area), key=natural):
                p = os.path.join(pasta_area, d)
                if not os.path.isdir(p) or d.upper() in PASTAS_ARTE or d.startswith("_"): continue
                arte = next((os.path.join(p, x) for x in os.listdir(p)
                             if x.upper() in PASTAS_ARTE and os.path.isdir(os.path.join(p, x))), None)
                grupos.append((d, p, imagens(p), arte))
            ordem = area.get("ordem", [])
            grupos.sort(key=lambda g: (ordem.index(g[0]) if g[0] in ordem else len(ordem), natural(g[0])))
            for nome, pasta, soltas, arte in grupos:
                c = cfg_ativ.get(nome, {})
                dest = os.path.join(SAIDA, "_web", area["slug"], slug(c.get("titulo", nome)))
                dados["atividades"].append({
                    "id": slug(c.get("titulo", nome)),
                    "titulo": c.get("titulo", nome),
                    "descricao": c.get("descricao", ""),
                    "tags": c.get("tags", []),
                    "apresentacao": processar_lista(pasta, soltas, dest, "apresentacao"),
                    "artes": processar_lista(arte, imagens(arte), dest, "arte") if arte else [],
                })
                print(f"  {area['titulo']} / {c.get('titulo', nome)}: "
                      f"{len(dados['atividades'][-1]['apresentacao'])} apresentações, "
                      f"{len(dados['atividades'][-1]['artes'])} artes")
        manifesto["areas"].append(dados)
    with open(os.path.join(SAIDA, "manifesto.js"), "w", encoding="utf-8") as f:
        f.write("/* Gerado por gerar-galeria.py. Não edite à mão: edite textos-portfolio.json e rode o script. */\n")
        f.write("window.PORTFOLIO = " + json.dumps(manifesto, ensure_ascii=False, indent=1) + ";\n")
    print("Pronto: assets/manifesto.js atualizado.")

if __name__ == "__main__":
    main()
