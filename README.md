# Tijuco Promoções

Aplicativo mobile de promoções para o comércio de Ituiutaba-MG.

## Objetivo

Conectar consumidores a ofertas de estabelecimentos locais, permitindo consultar promoções, favoritar produtos e compartilhar ofertas.

O projeto está sendo desenvolvido com Expo, React Native, TypeScript e Supabase.

## Tecnologias

- React Native
- Expo
- TypeScript
- Supabase
- Supabase Auth
- Supabase Storage
- Git e GitHub

## Funcionalidades desenvolvidas

### Área do cliente
- Cadastro e login de clientes
- Confirmação de e-mail
- Recuperação de senha
- Consulta de promoções
- Pesquisa e filtros por categoria
- Ordenação e paginação das promoções
- Favoritos
- Detalhes das promoções
- Compartilhamento de ofertas
- Denúncia de promoções
- Exclusão de conta

### Área do lojista
- Cadastro e login de lojistas
- Perfil da loja
- Cadastro e edição de promoções
- Gerenciamento de promoções
- Seleção de imagens pela câmera ou galeria
- Upload de imagens para o Supabase Storage

## Banco de dados

O projeto utiliza Supabase para autenticação, armazenamento e persistência dos dados.

Tabelas e recursos envolvidos incluem:

- `lojas`
- `lojas_privado`
- `clientes`
- `promocoes`
- `favoritos`
- Recursos para denúncias e exclusão de contas

Os scripts SQL de atualização estão disponíveis no projeto.

## Como executar

Instale as dependências:

```bash
npm install
```

Inicie o Expo:

```bash
npx expo start
```

Para abrir no celular, utilize o Expo Go e escaneie o QR Code.

## Observações importantes

- O projeto mobile é separado do projeto web Tijuco Promoções.
- As credenciais do Supabase devem ser configuradas corretamente no ambiente local.
- Nunca enviar chaves secretas ou a `service_role` do Supabase para o GitHub.
- As funcionalidades precisam ser testadas no aplicativo e no Supabase antes de considerar a versão pronta para produção.

## Próximos passos

- [ ] Testar cadastro e login de clientes
- [ ] Testar cadastro e login de lojistas
- [ ] Validar permissões e políticas RLS do Supabase
- [ ] Testar cadastro, edição e exclusão de promoções
- [ ] Testar upload de imagens
- [ ] Testar favoritos e compartilhamento
- [ ] Validar exclusão de conta
- [ ] Melhorar interface e experiência mobile
- [ ] Preparar versão de testes para Android

## Histórico do projeto

Este README registra o estado atual do desenvolvimento para facilitar a continuidade futura.
