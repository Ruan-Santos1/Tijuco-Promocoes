# Tijuco Promoções

<p align="center">
  <strong>As melhores ofertas do comércio local em um só lugar.</strong>
</p>

<p align="center">
  Plataforma de divulgação de promoções do comércio de Ituiutaba — MG.
</p>

---

## Sobre o projeto

O **Tijuco Promoções** conecta consumidores e comerciantes de Ituiutaba, Minas Gerais. Os lojistas divulgam seus produtos e ofertas, e os consumidores encontram oportunidades de compra no comércio local.

O projeto tem duas aplicações, que usam o mesmo banco de dados:

- **Site** (`web/`): consulta de ofertas e área do lojista, direto no navegador.
- **Aplicativo** (`mobile/`): versão para celular, com contas de cliente e de lojista.

## Estrutura do repositório

```text
Tijuco-Promocoes/
├── web/          Site (HTML, CSS e JavaScript)
├── mobile/       Aplicativo (Expo, React Native e TypeScript)
├── database/     Scripts do banco de dados (Supabase / PostgreSQL)
├── docs/         Política de Privacidade e Termos de Uso (GitHub Pages)
├── brand/        Arquivos originais do logotipo
└── README.md
```

## Identidade visual

O site e o aplicativo usam a mesma identidade, tirada do logotipo:

| Elemento | Valor |
|---|---|
| Azul-marinho (cor principal) | `#07172B` |
| Azul médio | `#17385D` |
| Dourado (destaque) | `#F6B51C` |
| Fundo | `#F4F6F9` |
| Tipografia do site | Plus Jakarta Sans |
| Ícones | Traço fino (Feather no site, Ionicons no aplicativo) |

As cores ficam em `web/style.css` (variáveis no início do arquivo) e em `mobile/src/theme.ts`. A pasta `brand/` guarda o logotipo original, a versão sem fundo e a marca reduzida com o javali, usada em tamanhos pequenos.

## Funcionalidades

| Funcionalidade | Site | Aplicativo |
|---|:---:|:---:|
| Consulta de promoções, busca, filtros e ordenação | ✔ | ✔ |
| Detalhes da oferta, WhatsApp da loja e compartilhamento | ✔ | ✔ |
| Favoritos | ✔ (no navegador) | ✔ (na conta) |
| Cadastro e login de lojista | ✔ | ✔ |
| Recuperação de senha | ✔ | ✔ |
| Publicação e exclusão de promoções | ✔ | ✔ |
| Edição e pausa de promoções | — | ✔ |
| Edição do perfil da loja | — | ✔ |
| Conta de cliente | — | ✔ |
| Denúncia de promoções | — | ✔ |
| Exclusão de conta | — | ✔ |

## Tecnologias

| Parte | Tecnologias |
|---|---|
| Site | HTML5, CSS3, JavaScript |
| Aplicativo | Expo, React Native, TypeScript |
| Backend | Supabase (PostgreSQL, Auth e Storage) |
| Versionamento | Git e GitHub |

## Como executar

Clone o repositório:

```bash
git clone https://github.com/Ruan-Santos1/Tijuco-Promocoes.git
```

### Site

Abra a pasta do projeto no VS Code e inicie o `web/index.html` com a extensão **Live Server**. A pasta `web/` já está configurada como raiz do Live Server.

### Aplicativo

```bash
cd mobile
```

```bash
npm install
```

```bash
npx expo start
```

Para abrir no celular, use o Expo Go e escaneie o QR Code. O passo a passo de publicação está em [mobile/PUBLICACAO.md](mobile/PUBLICACAO.md).

### Banco de dados

Os scripts e a situação de cada atualização estão em [database/README.md](database/README.md).

A conexão com o Supabase fica em `web/supabase.js` e `mobile/src/supabase.ts`. Esses arquivos usam apenas a chave pública (publishable).

> Nunca publique a chave `service_role` nem outras credenciais administrativas no código ou no GitHub.

## Próximos passos

- [ ] Aplicar as atualizações pendentes do banco (`database/README.md`).
- [ ] Publicar a pasta `docs/` no GitHub Pages e informar os endereços em `mobile/src/privacy.ts`.
- [ ] Levar ao site a edição de promoções e do perfil da loja.
- [ ] Enviar as fotos do site para o Supabase Storage, como o aplicativo já faz.
- [ ] Testar cadastro, login, publicação e exclusão de conta nos dois aplicativos.
- [ ] Preparar a versão de testes para Android.
- [ ] Publicar o site em produção.

## Objetivo acadêmico e profissional

O Tijuco Promoções faz parte da minha jornada de aprendizado em **Análise e Desenvolvimento de Sistemas (ADS)**. O projeto aplica conhecimentos de desenvolvimento web e mobile, banco de dados, autenticação, versionamento de código e integração com serviços externos.

## Desenvolvedor

**Ruan Santos** — [@Ruan-Santos1](https://github.com/Ruan-Santos1)

---

<p align="center">
  Desenvolvido para valorizar o comércio local de Ituiutaba — MG.
</p>
