// Gera docs/index.html (Política) e docs/termos.html (Termos) a partir do texto do app.
// Uso: npm run paginas
import { mkdirSync, writeFileSync } from 'fs';
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
body{margin:0;background:#f7f8fa;color:#34443a;font:16px/1.65 system-ui,Arial,sans-serif}
main{max-width:720px;margin:0 auto;padding:32px 20px 60px}
h1{color:#17231b;margin:0 0 4px}h2{color:#17231b;font-size:1.1rem;margin:28px 0 6px}
p{margin:0 0 8px}.meta{color:#747b75;font-size:.9rem}a{color:#16803c;font-weight:700}
</style>
</head>
<body>
<main>
<h1>${titulo}</h1>
<p class="meta">Tijuco Promoções · Atualizada em ${ATUALIZADA_EM}</p>
${secoes.map((s) => `<h2>${esc(s.titulo)}</h2>\n${esc(s.texto).split('\n').map((l) => `<p>${l}</p>`).join('\n')}`).join('\n')}
<p style="margin-top:32px">${outro}</p>
</main>
</body>
</html>
`;

mkdirSync('docs', { recursive: true });
writeFileSync('docs/index.html', page('Política de Privacidade', POLITICA, 'Veja também os <a href="termos.html">Termos de Uso</a>.'));
writeFileSync('docs/termos.html', page('Termos de Uso', TERMOS, 'Veja também a <a href="index.html">Política de Privacidade</a>.'));
console.log('Páginas geradas em docs/');
