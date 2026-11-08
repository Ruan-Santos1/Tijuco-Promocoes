# Publicação do Tijuco Promoções

## 1. Banco de dados (Supabase)
1. SQL Editor: rode `supabase-atualizacao.sql` e depois `supabase-atualizacao-2.sql`.
2. Authentication > URL Configuration > Redirect URLs: adicione `tijuco://reset-password`.
3. Authentication > Emails > SMTP Settings: configure um SMTP próprio (Resend ou Brevo, por exemplo).
4. Confira o RLS das tabelas `lojas`, `promocoes` e `favoritos`.

## 2. Textos legais
1. Edite `src/privacy.ts`: e-mail de contato (`CONTATO`) e nome do responsável (`CONTROLADOR`).
2. Rode `npm run paginas` para regenerar `docs/index.html` (Política) e `docs/termos.html` (Termos).
3. GitHub: Settings > Pages > Branch `main`, pasta `/docs`. Cole os endereços em `POLITICA_URL` e `TERMOS_URL` (`src/privacy.ts`).

## 3. Build
1. `npm install -g eas-cli` (ou use `npx`), depois `eas login` e `eas init`.
2. APK para testes: `npm run build:apk`
3. Google Play (AAB): `npm run build:loja`
4. O identificador `br.com.tijucopromocoes` (em `app.json`) não muda depois de publicado. Troque antes, se quiser outro.

## Observação sobre recuperar senha
O link do e-mail abre o app pelo endereço `tijuco://reset-password`. Isso funciona no APK/build instalado, mas não no Expo Go.
