// Gera docs/index.html (Política) e docs/termos.html (Termos) a partir do texto do app.
// As páginas ficam em docs/, na raiz do repositório (pasta publicada pelo GitHub Pages).
// Uso (dentro de mobile/): npm run paginas
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ATUALIZADA_EM, POLITICA } from '../src/privacy';
import { TERMOS } from '../src/terms';

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const page = (titulo: string, secoes: { titulo: string; texto: string }[], outro: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo} · Tijuco Promoções</title>
<style>
body{margin:0;background:#f4f6f9;color:#1d2938;font:16px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
header{background:#07172b;border-bottom:3px solid #f6b51c;color:#fff;font-weight:800;font-size:1.15rem;padding:16px 20px}
header div{max-width:720px;margin:0 auto}header span{color:#f6b51c}
main{max-width:720px;margin:0 auto;padding:32px 20px 60px}
h1{color:#07172b;margin:0 0 4px;letter-spacing:-.02em}h2{color:#07172b;font-size:1.1rem;margin:28px 0 6px}
p{margin:0 0 8px}.meta{color:#5f6c80;font-size:.9rem}a{color:#17385d;font-weight:700}
</style>
</head>
<body>
<header><div>Tijuco <span>Promoções</span></div></header>
<main>
<h1>${titulo}</h1>
<p class="meta">Tijuco Promoções · Atualizada em ${ATUALIZADA_EM}</p>
${secoes.map((s) => `<h2>${esc(s.titulo)}</h2>\n${esc(s.texto).split('\n').map((l) => `<p>${l}</p>`).join('\n')}`).join('\n')}
<p style="margin-top:32px">${outro}</p>
</main>
</body>
</html>
`;

const DOCS = join(__dirname, '..', '..', 'docs');

mkdirSync(DOCS, { recursive: true });
writeFileSync(join(DOCS, 'index.html'), page('Política de Privacidade', POLITICA, 'Veja também os <a href="termos.html">Termos de Uso</a>.'));
writeFileSync(join(DOCS, 'termos.html'), page('Termos de Uso', TERMOS, 'Veja também a <a href="index.html">Política de Privacidade</a>.'));
console.log(`Páginas geradas em ${DOCS}`);
