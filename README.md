# Tijuco Promoções

Aplicativo mobile de promoções para o comércio de Ituiutaba-MG.

## Objetivo

Conectar consumidores a ofertas de estabelecimentos locais, permitindo consultar promoções, favoritar produtos e compartilhar ofertas.

## Tecnologias

- Expo
- React Native
- TypeScript
- Supabase
- Supabase Auth
- Supabase Storage
- Git e GitHub

## Funcionalidades desenvolvidas

### Área do cliente

- Cadastro e login
- Confirmação de e-mail
- Recuperação de senha
- Consulta de promoções
- Pesquisa e filtros por categoria
- Ordenação e paginação
- Favoritos
- Detalhes e compartilhamento de promoções
- Denúncia de promoções
- Exclusão de conta

### Área do lojista

- Cadastro e login
- Perfil da loja
- Cadastro, edição e gerenciamento de promoções
- Seleção de imagens pela câmera ou galeria
- Upload de imagens para o Supabase Storage

## Banco de dados

O projeto utiliza Supabase para autenticação, armazenamento e persistência dos dados.

Tabelas e recursos envolvidos:

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

## Observações

- O aplicativo mobile é separado do projeto web Tijuco Promoções.
- As credenciais do Supabase devem estar configuradas corretamente.
- Nunca enviar chaves secretas ou a `service_role` do Supabase para o GitHub.
- As funcionalidades precisam ser testadas antes da publicação.

## Próximos passos

- [ ] Testar cadastro e login de clientes
- [ ] Testar cadastro e login de lojistas
- [ ] Validar permissões RLS do Supabase
- [ ] Testar cadastro, edição e exclusão de promoções
- [ ] Testar upload de imagens
- [ ] Testar favoritos e compartilhamento
- [ ] Validar exclusão de conta
- [ ] Melhorar a interface mobile
- [ ] Preparar versão de testes para Android

## Histórico

Este arquivo registra o estado atual do desenvolvimento para facilitar a continuidade futura.
