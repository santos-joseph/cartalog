# Cartalog Vendedor

Aplicativo React Native/Expo para vendedores cadastrados pelo dono no Cartalog Desktop. Usa a mesma API e os mesmos leads da web.

## O que já funciona

- Login apenas com e-mail e senha; contas de dono são recusadas.
- Sessão nativa guardada no Expo SecureStore, com renovação automática do token.
- Fila de leads e carteira do vendedor com busca, filtros de status, atualização e paginação.
- Assumir e devolver leads à fila.
- Ficha do lead com cliente, veículo, mensagem e histórico.
- Atalhos para ligação, WhatsApp e e-mail quando o lead está atribuído ao vendedor.
- Registrar observação, ligação, WhatsApp ou e-mail no histórico.
- Atualizar status; quando for **Perdido**, o motivo é obrigatório.
- Alterar a senha e sair da conta.

As permissões são aplicadas também pela API: só o vendedor atribuído pode registrar interações e atualizar o status. O dono cria vendedores e distribui leads pelo Desktop/web.

## Rodar

1. Inicie PostgreSQL e API (`cd api && npm run dev`). A API usa a porta `3333` por padrão.
2. Em outro terminal:

   ```powershell
   cd mobile
   npm install
   npx expo start
   ```

3. Abra no emulador Android, simulador iOS ou Expo Go compatível com o SDK do projeto.

No Expo Go pela rede local, o app detecta o IP do computador pelo servidor Expo e usa a porta `3333` para a API. No **emulador Android** sem essa detecção, usa `http://10.0.2.2:3333`; no **simulador iOS**, `http://localhost:3333`. Em **celular físico**, computador e aparelho precisam estar na mesma rede. Se a detecção não funcionar (por exemplo, com túnel), abra “Configurar endereço da API” no login e informe `http://IP_DO_COMPUTADOR:3333`. Também é possível criar `.env.local` com `EXPO_PUBLIC_API_URL` seguindo `.env.example`.

O vendedor precisa ter sido criado e estar ativo. A API identifica sua loja pelo e-mail da conta. O servidor aceita HTTP na rede local para desenvolvimento; use HTTPS para distribuição externa.

## Gerar APK para instalar em um celular Android

O perfil `preview` em `eas.json` produz APK de distribuição interna. É necessário fazer login em uma conta Expo, vincular o projeto na primeira execução e aceitar a configuração de assinatura Android:

```bash
cd mobile
npx eas-cli@latest login
npm run build:apk
```

Ao concluir, abra o link do build no Android para baixar e instalar. O APK é apenas o cliente do vendedor: a API deve estar acessível ao celular. Na tela de login, use **Configurar endereço da API** com `http://IP_DO_COMPUTADOR:3333` na mesma rede ou com a URL HTTPS do servidor. Consulte [APRESENTACAO.md](../APRESENTACAO.md).

## Verificações

```powershell
npx tsc --noEmit
npx expo install --check
npx expo export --platform android
```

O projeto usa Expo Router, `expo-secure-store`, `lucide-react-native` e `react-native-svg`. Ainda não inclui notificações push nem agenda de retornos, pois a API atual não expõe esses fluxos.
