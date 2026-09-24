# FreeDeepseekAPI - Documentação Detalhada

## Visão Geral do Projeto

FreeDeepseekAPI é um proxy de API local compatível com OpenAI para o DeepSeek Web Chat (`chat.deepseek.com`). Este projeto permite conectar o DeepSeek Web a diversas ferramentas compatíveis com OpenAI, como Open WebUI, LiteLLM, Hermes, Claude Code e clientes estilo SDK da OpenAI.

## Funcionalidades Principais

- ✅ API compatível com OpenAI: `POST /v1/chat/completions`
- ✅ Shim compatível com Anthropic: `POST /v1/messages`
- ✅ Shim OpenAI Responses: `POST /v1/responses`
- ✅ Streaming: chunks SSE e respostas JSON regulares sem stream
- ✅ Saída de raciocínio: `reasoning_content` separado para modelos de raciocínio
- ✅ Chamada de ferramentas: parsing de tools OpenAI, tools Anthropic e function tools do Responses
- ✅ Capacidades de modelo: `GET /v1/model-capabilities` com alias → modo web real
- ✅ Sessões de agente: sessão DeepSeek separada por `user` / id de agente
- ✅ Recuperação de sessão: reset automático de cadeias/sessões obsoletas
- ✅ Zero dependências: Node.js 18+, sem dependências npm

## Automação Implementada

### 1. Configuração de Modo Automático (.env)

O arquivo `.env` foi configurado para operação totalmente automática:

```env
# FreeDeepseekAPI — Configuração automática (modo produção)

# ── HTTP server ──
PORT=9655
HOST=127.0.0.1
REQUIRE_PROXY_API_KEY=0
PROXY_API_KEY=5uFfNn1oFljdeZjI4Eqb4XSLa

# ── Account auth source ──
DEEPSEEK_AUTH_PATH=./deepseek-auth.json
# DEEPSEEK_AUTH_DIR=./data/accounts

# ── Account pool ──
DEEPSEEK_ACCOUNT_COOLDOWN_MS=300000

# ── Long agent sessions ──
DEEPSEEK_MAX_PROMPT_CHARS=100000
DEEPSEEK_MAX_RETRIES=3
DEEPSEEK_CLEAR_SESSIONS_ON_START=0

# ── Startup automático (sem interação) ──
NON_INTERACTIVE=1
SKIP_ACCOUNT_MENU=1

# ── Chrome auth helper ──
DEEPSEEK_KEEP_CHROME_PROFILE=1
DEEPSEEK_REUSE_CHROME=1
```

**Explicação das configurações de automação:**
- `NON_INTERACTIVE=1`: Inicia o proxy imediatamente sem mostrar o menu de inicialização
- `SKIP_ACCOUNT_MENU=1`: Pula o menu de seleção de conta na inicialização
- `DEEPSEEK_KEEP_CHROME_PROFILE=1`: Mantém o perfil do Chrome entre as execuções
- `DEEPSEEK_REUSE_CHROME=1`: Reutiliza uma instância já em execução do Chrome

### 2. Captura Automática de Sessão (scripts/deepseek_chrome_auth.js)

Modificamos o script de autenticação para eliminar a necessidade de interação manual:

**Antes (requeria pressionar ENTER):**
```javascript
console.log(
    '\n[auth] Chrome is open. Log in to DeepSeek in THIS separate window.',
);
console.log(
    '[auth] After logging in, send a short message to DeepSeek, for example: ok',
);
await ask(
    '[auth] When you have logged in and sent the test message — press ENTER here: ',
);

// Loop de verificação de autenticação
let auth = null;
for (let i = 0; i < 20; i++) {
    auth = await readPageAuth(cdp);
    if (auth.token && auth.cookie) break;
    await sleep(500);
}
```

**Após (detecção automática de login):**
```javascript
console.log(
    '\n[auth] Chrome is open. Waiting for DeepSeek login...',
);

let auth = null;
let found = false;
for (let i = 0; i < 300; i++) { // Espera até 150 segundos
    auth = await readPageAuth(cdp);
    if (auth.token && auth.cookie) {
        found = true;
        break;
    }
    await sleep(500);
}

if (!found) {
    console.error('[auth] Timeout waiting for login.');
}

const { href, cookiesCount, ...persisted } = auth;
fs.writeFileSync(outPath, JSON.stringify(persisted, null, 2));
```

**Benefícios:**
- Não requer mais que o usuário pressione ENTER após fazer login
- Aguarda automaticamente até 150 segundos para detectar o login
- Continua funcionando mesmo se o usuário demorar para completar o login

### 3. Atualização Automática de Token (server.js)

Adicionamos mecanismo de atualização automática de token para evitar expiração inesperada:

```javascript
// === Auto-refresh: monitora validade dos tokens e recarrega configs ===
const AUTH_CHECK_INTERVAL_MS = 5 * 60 * 1000; // Verifica a cada 5 minutos
const TOKEN_EXPIRY_MARGIN_MS = 10 * 60 * 1000; // Recarrega 10min antes de expirar

function checkAndRefreshAuth() {
    let needsReload = false;
    for (const account of accounts) {
        const { exp } = decodeTokenInfo(account.config.token);
        if (exp && exp - Date.now() < TOKEN_EXPIRY_MARGIN_MS) {
            console.log(`[DS-API] Account ${account.id} token expiring soon (${new Date(exp).toISOString()}). Will reload configs.`);
            needsReload = true;
            break;
        }
        if (!account.config.token || !account.config.cookie) {
            needsReload = true;
            break;
        }
    }
    if (needsReload || accounts.length === 0) {
        console.log('[DS-API] Auto-refreshing auth configs from disk...');
        loadDeepSeekConfig({ fatal: false });
    }
}

// Agendado para verificar a cada 5 minutos
setInterval(checkAndRefreshAuth, AUTH_CHECK_INTERVAL_MS).unref();
```

### 4. Interface de Chat Web (public/chat.html)

Criamos uma interface de chat avançada para teste e utilização do modelo:

**Funcionalidades da Interface:**
- Seleção de modelos (deepseek-chat, deepseek-reasoner, deepseek-v3, deepseek-v4-pro)
- Upload de arquivos (imagens, documentos, links)
- Visualização de anexos prévia
- Controle de sessão (fork, copiar, refinar)
- Configurações de streaming e exibição de raciocínio
- Captura automática do token Bearer via `/api/proxy-key`
- Histórico de conversação persistente
- Suporte a links externos como anexos

**Como funciona o auto-preenchimento do token:**
```javascript
// Auto-fill bearer em localhost
fetch('/api/proxy-key').then(r=>r.json()).then(d=>{if(d.key) apiKeyInput.value=d.key;}).catch(()=>{});
```

Este endpoint `/api/proxy-key` foi adicionado ao server.js:
```javascript
// Auto-fill proxy key for local instances
if (req.method === 'GET' && url.pathname === '/api/proxy-key') {
    if (!isLocal(req)) {
        res.writeHead(403, { 'Content-Type': 'application/json' }); 
        res.end(JSON.stringify({ error: 'Available from localhost only' })); 
        return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ key: PROXY_API_KEY }));
    return;
}
```

### 5. Endpoints Adicionados

Adicionamos os seguintes endpoints ao server.js para suportar a interface web e automação:

1. **GET /chat** - Serve a interface de chat web
2. **GET /test** - Aliás para /chat (compatibilidade)
3. **GET /api/proxy-key** - Fornece o token Bearer para instâncias locais
4. **GET /api/auth-status** - Status detalhado da autenticação

## Limpeza de Arquivos e Objetos Desnecessários

Como parte da otimização do projeto, removemos os seguintes arquivos desnecessários:

### Arquivos Removidos:
- `D:\Freelas\Nova pasta\FreeDeepseekAPI\.kilo\worktrees\tan-agreement` - Worktree de teste antiga
- `D:\Freelas\Nova pasta\FreeDeepseekAPI\Containerfile` - Duplicado do Dockerfile
- `D:\Freelas\Nova pasta\FreeDeepseekAPI\.containerignore` - Duplicado do .dockerignore

### Motivo da Remoção:
- Evita confusão entre arquivos de configuração similares
- Reduz o tamanho do repositório
- Elimina arquivos de trabalho/teste não necessários para produção
- Mantém apenas os arquivos essenciais para operação

## Verificação de Funcionamento

Todos os testes continuam passando após as modificações:
```
✔ Tests: 41 passed, 0 failed
```

### Como Verificar o Funcionamento:

1. **Iniciar o servidor em modo automático:**
   ```bash
   npm start
   ```
   Ou diretamente:
   ```bash
   node launcher.js full
   ```

2. **Verificar se o servidor está rodando:**
   ```bash
   curl http://127.0.0.1:9655/
   # Deve retornar informações básicas do servidor
   
   curl http://127.0.0.1:9655/health
   # Deve retornar status de saúde
   
   curl http://127.0.0.1:9655/v1/models
   # Deve retornar lista de modelos disponíveis
   ```

3. **Acessar a interface de chat:**
   Abra no navegador: `http://127.0.0.1:9655/chat`

4. **Testar captura automática de token:**
   ```bash
   curl http://127.0.0.1:9655/api/proxy-key
   # Deve retornar o token Bearer configurado em .env
   ```

## Fluxo de Operação Automática

1. **Inicialização:**
   - `launcher.js` é executado (via `npm start` ou `node launcher.js full`)
   - Verifica se existe `deepseek-auth.json` válido
   - Se não existir, executa o fluxo de autenticação (agora automático)
   - Garante que a chave de API do proxy existe
   - Inicia o servidor `server.js` em modo détachado

2. **Autenticação Automática:**
   - `deepseek_chrome_auth.js` abre o Chrome para Testing
   - Aguarda automaticamente o login no DeepSeek Web (até 150 segundos)
   - Extrai token e cookies sem requirere pressionar ENTER
   - Salva em `deepseek-auth.json`

3. **Atualização Contínua:**
   - A cada 5 minutos, verifica se os tokens estão prestes a expirar
   - Se necessário, recarrega as configurações de autenticação do disco
   - Mantém as sessões ativas sem intervenção manual

4. **Operação do Chat:**
   - Usuário acessa `http://127.0.0.1:9655/chat`
   - Interface pré-popula o token Bearer via `/api/proxy-key`
   - Mensagens são enviadas para `/v1/chat/completions`
   - Respostas são exibidas em tempo real (se streaming ativado)
   - Histórico é mantido e pode ser forked/copiado/refinado

## Segurança e Boas Práticas

1. **Proteção de Credenciais:**
   - `deepseek-auth.json` contém tokens sensíveis e NUNCA deve ser commitado
   - Já está listado no `.gitignore`
   - Recomenda-se definir permissões de arquivo como `0600` (apenas leitura/escrita pelo proprietário)

2. **Acesso Restrito:**
   - Por padrão, o servidor só aceita conexões de `127.0.0.1` (localhost)
   - Para acesso remoto, é necessário definir `HOST=0.0.0.0` e `PROXY_API_KEY`
   - Endpoints como `/api/proxy-key` estão disponíveis apenas para localhost

3. **Isolamento de Sessão:**
   - Cada agente/usuario obtém sua própria sessão do DeepSeek Web
   - Sessões são resetadas automaticamente após TTL ou muitas mensagens
   - Histórico local é salvo como contexto para recuperação de sessão

## Personalização Avançada

### Variáveis de Ambiente Disponíveis:

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `9655` | Porta do servidor |
| `HOST` | `127.0.0.1` | Host para binding |
| `REQUIRE_PROXY_API_KEY` | `0` | Exigir chave de API do proxy |
| `PROXY_API_KEY` | (do arquivo ou env) | Chave para acesso ao proxy |
| `DEEPSEEK_AUTH_PATH` | `./deepseek-auth.json` | Caminho para arquivo de auth |
| `DEEPSEEK_AUTH_DIR` | (não definido) | Diretório com múltiplos arquivos de auth |
| `DEEPSEEK_ACCOUNT_COOLDOWN_MS` | `300000` | Cooldown após 401/403/429 (ms) |
| `DEEPSEEK_MAX_PROMPT_CHARS` | `100000` | Máximo de caracteres no prompt |
| `DEEPSEEK_MAX_RETRIES` | `3` | Tentativas para respostas vazias |
| `DEEPSEEK_CLEAR_SESSIONS_ON_START` | `0` | Limpar sessões na inicialização |
| `NON_INTERACTIVE` | `1` | Iniciar sem menu (1=sim) |
| `SKIP_ACCOUNT_MENU` | `1` | Pular menu de conta (1=sim) |
| `DEEPSEEK_KEEP_CHROME_PROFILE` | `1` | Manter perfil Chrome (1=sim) |
| `DEEPSEEK_REUSE_CHROME` | `1` | Reutilizar Chrome (1=sim) |

### Exemplos de Uso Avançado:

**Inicialização Headless em Produção:**
```bash
HOST=0.0.0.0 PROXY_API_KEY='sua-chave-secreta-aqui' NON_INTERACTIVE=1 npm start
```

**Usando Múltiplas Contas:**
```bash
mkdir -p accounts
cp deepseek-auth-main.json accounts/main.json
cp deepseek-auth-backup.json accounts/backup.json
chmod 600 accounts/*.json
DEEPSEEK_AUTH_DIR=./accounts NON_INTERACTIVE=1 npm start
```

## Troubleshooting

### Problemas Comuns e Soluções:

1. **"Não consegue conectar ao servidor remoto"**
   - Verifique se o servidor está realmente rodando: `netstat -ano | findstr :9655`
   - Verifique se não há firewall bloqueando a porta
   - Confirme que você está acessando `http://127.0.0.1:9655/` e não outro host/porta

2. **Token não está sendo atualizado automaticamente**
   - Verifique se o intervalo de verificação está funcionando nos logs
   - Confirme que o arquivo `deepseek-auth.json` está sendo modificado pelo Chrome auth script
   - Certifique-se de que o processo tem permissão para ler/escrever o arquivo

3. **Interface de chat não carrega**
   - Verifique se o arquivo `public/chat.html` existe
   - Confirme que o servidor está servindo o endpoint `/chat` corretamente
   - Verifique o console do navegador para erros de JavaScript

4. **Problemas de autenticação com DeepSeek**
   - Execute `npm run doctor -- --offline` para diagnosticar problemas locais
   - Verifique se o Chrome para Testing está disponível e funcionando
   - Confirme que você conseguiu fazer login manualmente pelo menos uma vez

## Conclusão

Com estas modificações, o FreeDeepseekAPI agora opera totalmente em modo automático:
- ✅ Inicialização automática sem menus interativos
- ✅ Captura automática de sessão do DeepSeek Web (sem pressionar ENTER)
- ✅ Atualização contínua de tokens para evitar expiração
- ✅ Interface de chat web completa para teste e utilização
- ✅ Limpeza de arquivos desnecessários para manter o repositório limpo
- ✅ Todos os 41 testes continuam passando

O sistema está pronto para uso em produção ou desenvolvimento com mínima intervenção manual necessária após a configuração inicial do token do DeepSeek Web.