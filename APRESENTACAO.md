# Cartalog — preparação da apresentação

Este roteiro separa o **cliente** (desktop/web/mobile) do **servidor** (API + PostgreSQL). Instalar um cliente não instala a API nem o banco. Todos os clientes precisam alcançar a mesma API para compartilhar empresas, veículos e leads.

## No Mac da apresentação

Pré-requisitos: Node.js 22 ou superior, npm, Docker Desktop iniciado e internet na primeira instalação de dependências. O repositório deve estar completo no Mac; não basta copiar o instalador Windows. O banco local de demonstração fica em uma porta privada (`127.0.0.1:5434`), evitando conflito com um PostgreSQL já instalado.

```bash
git clone https://github.com/santos-joseph/cartalog.git
cd cartalog
node scripts/demo.mjs setup
node scripts/demo.mjs start --desktop
```

O primeiro comando instala dependências de API, web e desktop, cria o banco de demonstração no Docker, aplica **todas as migrações**, popula marcas/modelos/combustíveis/opcionais e solicita nome, e-mail e senha do primeiro administrador global **somente se ele ainda não existir**. Ele não cria uma loja nem um usuário com senha padrão. A senha é digitada no terminal e nunca é gravada no repositório. O segundo comando abre API (`http://localhost:3333`), web (`http://localhost:3000`) e desktop. Mantenha esse terminal aberto durante a apresentação. A configuração local gerada fica em `api/.env.demo` e é ignorada pelo Git.

Para repetir o fluxo com um só comando no Mac, execute `bash iniciar-demo-mac.command`; no Windows com Docker, execute `iniciar-demo-windows.cmd`. Esses lançadores chamam o mesmo setup idempotente e iniciam os três serviços. O `--existing-db` fica disponível no comando manual para quem já usa PostgreSQL nativo.

Se preferir usar PostgreSQL já instalado, configure `DATABASE_URL` no ambiente ou em `api/.env` e execute `node scripts/demo.mjs setup --existing-db`. Confirme que a URL aponta para um **banco de demonstração** antes de executar as migrações. O script nunca reseta o banco. Se uma configuração `.env.demo` anterior apontar para outro banco, ele interrompe a troca para evitar aplicar migrações no destino errado.

Depois de criar o administrador global, entre pelo desktop ou por `http://localhost:3000/platform/login`. A equipe Cartalog cria a empresa e o dono no painel global; o dono cadastra vendedores no desktop. O vendedor faz login com e-mail na web ou no mobile. O slug serve para o endereço público da loja.

## Instaladores

| Destino | Arquivo/fluxo | O que instala |
| --- | --- | --- |
| Windows | `desktop/release/Cartalog-Desktop-Setup-0.1.1.exe` | Apenas o app desktop. Usa API local por padrão; para clientes reais, precisa da URL HTTPS da API central. O instalador atual não é assinado. |
| macOS | `cd desktop && npm run package:mac` **no Mac** | Gera um `.dmg` em `desktop/release/`. O `.exe` do Windows não abre no Mac. Para distribuição pública no Mac, assinar e notarizar o app. |
| Android | `cd mobile && npm run build:apk` | Solicita à EAS um APK de distribuição interna. Requer conta Expo autenticada e vínculo inicial do projeto. O link/arquivo produzido pode ser aberto no celular para instalar. |

O APK pode iniciar com endereço de API local inadequado para um celular físico. Na tela de login, abra **Configurar endereço da API** e informe `http://IP_DO_COMPUTADOR:3333` na mesma rede Wi-Fi. O firewall deve permitir acesso à porta 3333. Para uso fora da rede local, use uma API hospedada em HTTPS.

Os instaladores em `desktop/release/` são artefatos gerados e não entram no Git. Ao levar o código para o Mac, gere o `.dmg` lá; se também quiser guardar o `.exe`, copie-o separadamente da máquina Windows.

## Roteiro de ensaio

1. Abra `http://localhost:3333/health`, `http://localhost:3000` e o desktop. Verifique os três antes de mostrar.
2. Entre como administrador global e confira empresa, assinatura e conta do dono.
3. No desktop, mostre vendedor, cadastro de veículo, personalização/páginas e manutenção do catálogo.
4. Na web, abra o catálogo da loja, gere um lead de teste e acompanhe no dashboard.
5. Entre como vendedor na web ou no Android, assuma o lead, registre uma interação e atualize o status.
6. Abra `slides/slides.html` no navegador; setas navegam e `F` entra em tela cheia.

Use contas e dados de teste. Não projete senhas pessoais nem arquivos `.env`.

## Para entregar a uma loja

O cliente recebe o instalador desktop (e futuramente o APK dos vendedores), mas a equipe Cartalog mantém **uma API e um PostgreSQL centrais**. Um banco local por cliente fragmentaria empresas, assinaturas e leads. O `scripts/demo.mjs` é um ambiente local para apresentação e desenvolvimento, não um instalador de produção do SaaS.
