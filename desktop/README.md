# Cartalog Desktop

Aplicativo Electron para o **dono da loja e a equipe global Cartalog**. O login usa apenas e-mail e senha e abre o espaço correspondente à conta. O estoque pode ser gerenciado pelo desktop ou pela web; vendedores atendem pela web e pelo mobile.

## Funcionalidades

- Entrar com uma conta de dono da loja ou administrador global existente.
- Gerenciar empresas, planos, assinaturas, pedidos de demonstração e administradores no espaço global. A auditoria reúne ações globais e alterações feitas em lojas, com autor, empresa e data, além de filtro e paginação.
- Cadastrar, renomear, desativar e reativar vendedores. Ao desativar, a API devolve os leads atribuídos à fila.
- Configurar logo, cores, contatos, endereço, opções do catálogo e informações para busca.
- Cadastrar e editar veículos, fotos, opcionais, categoria e status do estoque.
- Criar e gerenciar categorias e banners do catálogo público.
- Montar páginas públicas com blocos de abertura, texto, imagem e botão; salvar como rascunho ou publicar.
- Personalizar a página inicial, cor de fundo e tipografia do catálogo. A barra da janela tem controles próprios para minimizar, maximizar e fechar.

O app usa a API existente. Não acessa o PostgreSQL diretamente.

## Desenvolvimento

Com PostgreSQL e API rodando:

```powershell
cd desktop
Copy-Item .env.example .env
npm install
npm run dev
```

Padrão: API em `http://127.0.0.1:3333` e web em `http://localhost:3000`. Para usar outros endereços, edite `CARTALOG_API_URL` e `CARTALOG_WEB_BASE_URL` em `desktop/.env`. Fora de `localhost`, é obrigatório HTTPS. Os endereços são lidos quando o Electron inicia; reinicie o app após alterá-los.

Se o painel mostrar **API indisponível**, abra `http://127.0.0.1:3333/health` no mesmo computador. A resposta deve indicar `healthy`. Inicie a API e o PostgreSQL antes do desktop ou use `node scripts/demo.mjs start --desktop` após o setup descrito em [APRESENTACAO.md](../APRESENTACAO.md). O botão **Atualizar** repete o carregamento; as telas de administradores e auditoria são carregadas apenas quando abertas.

## Executar e gerar instalador

```powershell
npm run build
npm run start
npm run package:win
```

O instalador Windows é gerado em `desktop/release/`. O pacote atual não é assinado digitalmente. Para distribuição pública, configure certificado de assinatura e um endereço de API HTTPS de produção.

No macOS, gere o pacote no próprio Mac com `npm run package:mac`; o `.dmg` fica em `desktop/release/`. O instalador `.exe` só funciona no Windows. Ambos instalam apenas o cliente Electron e precisam da API e do banco ativos em um servidor. O roteiro local para a apresentação está em [APRESENTACAO.md](../APRESENTACAO.md).

## Segurança da sessão

O Electron usa `contextIsolation` e sandbox. A interface recebe apenas funções específicas do processo principal; não recebe tokens nem acesso livre ao Node.js. O refresh token da loja ou token de acesso global é salvo criptografado com o cofre do sistema quando o Electron consegue usá-lo. Sem esse recurso, a sessão funciona até o app fechar; o token global expira em 8 horas.

## Notas da API

- A equipe Cartalog cria a empresa e o dono pelo painel global na web ou no desktop; `npm run account:create` fica como recurso de recuperação.
- O dono pode ligar e desligar a manutenção do catálogo público na tela de configurações. A API registra cada mudança.
- `POST /api/v1/users` aceita apenas `SELLER` e exige `OWNER`.
- `GET/PUT /api/v1/companies/settings` salva personalização e contatos.
- As rotas privadas de veículos, categorias, páginas e banners exigem autenticação; a API limita as alterações ao dono.
- Páginas publicadas aparecem em `/paginas/{slug}` no site da loja.
