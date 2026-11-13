# Banco de dados

O Tijuco Promoções usa o Supabase (PostgreSQL). O site (`web/`) e o aplicativo (`mobile/`) usam o mesmo banco.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `schema.sql` | Cria o banco completo do zero em um projeto novo do Supabase. |
| `migrations/` | Scripts de atualização para um banco que já existe. Rode em ordem, uma vez cada. |

## Como rodar

No painel do Supabase: **SQL Editor > New query**, cole o conteúdo do arquivo e clique em **Run**.

## Situação das atualizações no banco de produção

Conferido em 13/11/2026: **todos os scripts estão aplicados.**

| Script | O que faz | Situação |
|---|---|---|
| `001_cadastro_lojista.sql` | Dados de cadastro do lojista e tabela `lojas_privado`. | Aplicado |
| `002_clientes_fotos_exclusao_conta.sql` | Tabela `clientes`, bucket de fotos e exclusão de conta. | Aplicado |
| `003_denuncias.sql` | Denúncias de ofertas. | Aplicado |
| `004_limpeza_politicas.sql` | Remove regras duplicadas e limita o bucket de fotos. | Aplicado |

Recomendação pendente do Supabase: ativar a proteção contra senhas vazadas em
**Authentication > Sign In / Up > Passwords** no painel (compara a senha com vazamentos conhecidos).

## Tabelas

| Tabela | Conteúdo | Quem lê |
|---|---|---|
| `lojas` | Dados públicos da loja: nome, WhatsApp, endereço, horário, Instagram. | Todos |
| `lojas_privado` | CPF/CNPJ e nome do responsável. | Só o próprio lojista |
| `clientes` | Nome do cliente e aceite da política. | Só o próprio cliente |
| `promocoes` | Ofertas publicadas pelas lojas. | Todos veem as ativas; o lojista vê todas as suas |
| `favoritos` | Ofertas salvas por cada usuário. | Só o próprio usuário |
| `denuncias` | Denúncias de ofertas (criada pelo `003`). | Só quem denunciou |

As fotos das ofertas ficam no bucket público `promocoes` do Supabase Storage, em uma pasta por lojista.

## Moderação de denúncias

Com 3 denúncias pendentes de pessoas diferentes, a oferta é ocultada automaticamente. Para analisar, abra **Table Editor > denuncias**. Depois, mude `status` para `analisada` (a oferta pode voltar com `ativa = true`) ou apague a promoção.
