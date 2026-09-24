# FreeDeepseekAPI

<p align="center">
  <strong>Proxy de API local compatível com OpenAI para o DeepSeek Web Chat</strong>
</p>

<p align="center">
  <a href="https://github.com/ForgetMeAI/FreeDeepseekAPI/blob/main/LICENSE"><img alt="License MIT" src="https://img.shields.io/badge/license-MIT-green.svg" /></a>
  <img alt="Node.js 18 plus" src="https://img.shields.io/badge/node-18%2B-339933.svg" />
  <img alt="No npm dependencies" src="https://img.shields.io/badge/dependencies-0-blue.svg" />
  <img alt="OpenAI compatible" src="https://img.shields.io/badge/OpenAI-compatible-111111.svg" />
</p>

<p align="center">
  <a href="#-início-rápido">Início Rápido</a> •
  <a href="#recursos">Recursos</a> •
  <a href="#-exemplos-de-requisições">Exemplos</a> •
  <a href="#-modelos">Modelos</a> •
  <a href="#-endpoints">Endpoints</a> •
  <a href="#-open-webui">Open WebUI</a>
</p>

A FreeDeepseekAPI executa um servidor de API local para o **DeepSeek Web Chat** (`chat.deepseek.com`) e permite que você conecte o DeepSeek Web ao Open WebUI, LiteLLM, Hermes, Claude Code, clientes estilo SDK da OpenAI e outras ferramentas compatíveis com OpenAI.

O projeto funciona através da sua conta normal logada do DeepSeek em um perfil separado do Chrome. O servidor local aceita requisições de API e então se comunica com o DeepSeek Web através da sessão do navegador salva.

> ⚠️ Este é um proxy experimental de chat web. O DeepSeek pode alterar a API Web interna sem aviso. Para casos de uso em produção, a API oficial paga do DeepSeek é mais confiável.

ForgetMeAI: https://t.me/forgetmeai

---

## Navegação

- [O que isso te oferece](#-o-que-isso-te-oferece)
- [Recursos](#recursos)
- [Início Rápido](#-início-rápido)
- [Inicialização no Windows](#-inicialização-no-windows)
- [Inicialização Linux / Chromium](#-inicialização-linux--chromium)
- [Inicialização VPS / Headless](#-inicialização-vps--headless)
- [Podman sem root](#-podman-sem-root)
- [Diagnóstico / doctor](#-diagnóstico--doctor)
- [Reutilização de sessão e reset de chat](#️-reutilização-de-sessão-e-reset-de-chat)
- [Pool de múltiplas contas](#-pool-de-múltiplas-contas)
- [Ideias de autenticação via console](#-ideias-de-autenticação-via-console)
- [Verificar se funciona](#-verificar-se-funciona)
- [Exemplos de requisições](#-exemplos-de-requisições)
  - [Chat Completions](#chat-completions)
  - [Raciocínio](#raciocínio)
  - [Busca web](#busca-web)
  - [Streaming](#streaming)
  - [Anthropic Messages API](#anthropic-messages-api)
  - [OpenAI Responses API](#openai-responses-api)
  - [Chamada de ferramentas](#chamada-de-ferramentas)
- [Modelos](#-modelos)
- [Endpoints](#-endpoints)
- [Open WebUI](#-open-webui)
- [Atualizar login](#-atualizar-login)
- [Testes](#-testes)
- [Status do projeto](#-status-do-projeto)

---

## ✨ O que isso te oferece

- Usar o DeepSeek Web como endpoint de API local.
- Conectar o DeepSeek ao Open WebUI e outros clientes compatíveis com OpenAI.
- Obter respostas JSON regulares ou streaming SSE.
- Usar modelos de raciocínio com `reasoning_content` separado.
- Trabalhar com o shim da Anthropic Messages API para Claude Code / Anthropic SDK.
- Usar o shim da OpenAI Responses API para novos clientes estilo OpenAI/Codex.
- Manter sessões web separadas para diferentes agentes/usuários.

## Recursos

- **API compatível com OpenAI:** `POST /v1/chat/completions`
- **Shim compatível com Anthropic:** `POST /v1/messages`
- **Shim OpenAI Responses:** `POST /v1/responses`
- **Streaming:** chunks SSE e respostas JSON regulares sem stream
- **Saída de raciocínio:** `reasoning_content` separado para modelos de raciocínio
- **Chamada de ferramentas:** parsing de tools OpenAI, tools Anthropic e function tools do Responses
- **Capacidades de modelo:** `GET /v1/model-capabilities` com alias → modo web real
- **Sessões de agente:** sessão DeepSeek separada por `user` / id de agente
- **Recuperação de sessão:** reset automático de cadeias/sessões obsoletas
- **Zero dependências:** Node.js 18+, sem dependências npm

---

## ⚡ Início Rápido

```bash
git clone https://github.com/ForgetMeAI/FreeDeepseekAPI.git
cd FreeDeepseekAPI
npm run auth
npm start
```

`npm run auth` abre o menu de autenticação:

1. selecione o item `1`;
2. faça login no DeepSeek em um perfil separado do Chrome;
3. envie uma mensagem curta como `ok`;
4. volte ao terminal e pressione Enter.

`npm start` mostra o menu de inicialização:

- `1` — autorizar / atualizar login do DeepSeek
- `2` — mostrar modelos e status
- `3` — iniciar proxy
- `4` — sair

Para inicialização headless/CI sem menu:

```bash
NON_INTERACTIVE=1 npm start
# ou
SKIP_ACCOUNT_MENU=1 npm start
```

Por padrão, o servidor escuta em:

```text
http://localhost:9655
```

Por padrão, o proxy é acessível apenas da mesma máquina. Para permitir
acesso pela rede, defina explicitamente o endereço de bind e uma chave de API do proxy:

```bash
HOST=0.0.0.0 PROXY_API_KEY='substitua-por-um-valor-longo-aleatorio' npm start
```

Então passe a chave como `Authorization: Bearer <chave>`. Sem `PROXY_API_KEY`,
os endpoints não-health permanecem sem autenticação, então não exponha essa
instância na rede.

Requisições do navegador são permitidas de origens loopback. Se a UI for aberta em
um endereço diferente, adicione sua origem exata via vírgula, ex.:
`PROXY_CORS_ORIGINS=https://ui.example.com,http://192.168.1.20:3000`.

---

## 🪟 Inicialização no Windows

```powershell
git clone https://github.com/ForgetMeAI/FreeDeepseekAPI.git
cd FreeDeepseekAPI
npm run auth
npm start
```

Se o Chrome estiver instalado em um local não-padrão, especifique o caminho explicitamente:

```powershell
$env:CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
npm run auth
```

Se o Chrome não for encontrado, `npm run auth` agora imprime instruções prontas para uso para Windows/macOS/Linux em vez de um stack trace confuso.

---

## 🐧 Inicialização Linux / Chromium

```bash
git clone https://github.com/ForgetMeAI/FreeDeepseekAPI.git
cd FreeDeepseekAPI
CHROME_PATH=$(which chromium) npm run auth
npm start
```

Se o Chromium tiver um nome diferente:

```bash
CHROME_PATH=$(which chromium-browser) npm run auth
# ou
CHROME_PATH=$(which google-chrome) npm run auth
```

---

## ☁️ Inicialização VPS / Headless

O fluxo mais confiável sem Chrome no servidor:

1. No seu PC pessoal (onde você tem GUI/Chrome):

```bash
npm run auth
```

2. Copie `deepseek-auth.json` para o VPS:

```bash
scp deepseek-auth.json user@seu-vps:/opt/FreeDeepseekAPI/deepseek-auth.json
```

3. No VPS importe/verifique o arquivo e defina permissões seguras:

```bash
cd /opt/FreeDeepseekAPI
npm run auth:import -- --input ./deepseek-auth.json
npm run doctor -- --offline
```

4. Inicie o proxy sem menu interativo:

```bash
NON_INTERACTIVE=1 npm start
```

Você pode importar não apenas um `deepseek-auth.json` pronto, mas também uma exportação de cookies do navegador:

```bash
DEEPSEEK_TOKEN="<token>" npm run auth:import -- --input ./cookies.json
```

> Importante: `deepseek-auth.json` dá acesso ao seu login do DeepSeek Web. Não faça commit, não publique, armazene com permissões `0600`.

---

## 🦭 Podman sem root

O container é destinado apenas para inicialização não-interativa do proxy. Realize
a autorização via navegador no host com `npm run auth`: scripts de auth e
`deepseek-auth.json` não são copiados para a imagem.

Execute o Podman como usuário regular, sem `sudo`.

1. Construa a imagem local:

```bash
podman build --tag localhost/free-deepseek-api:local --file Containerfile .
```

2. Passe o auth do DeepSeek e uma chave de API do proxy separada via secrets do Podman:

```bash
podman secret create --replace free-deepseek-auth ./deepseek-auth.json

printf 'Chave de API do Proxy: '
IFS= read -r -s PROXY_API_KEY
printf '\n'
printf '%s' "$PROXY_API_KEY" |
  podman secret create --replace free-deepseek-proxy-key -
```

Use uma chave aleatória longa. O valor fica na variável `PROXY_API_KEY`
do shell atual para verificação da API; ele não vai para a imagem nem para a
linha de comando do Podman.

3. Execute o container com privilégios mínimos:

```bash
podman run --detach \
  --name free-deepseek-api \
  --publish 127.0.0.1:9655:9655 \
  --secret free-deepseek-auth,target=deepseek-auth.json,uid=1000,gid=1000,mode=0400 \
  --secret free-deepseek-proxy-key,target=proxy-api-key,uid=1000,gid=1000,mode=0400 \
  --read-only \
  --cap-drop=ALL \
  --security-opt=no-new-privileges \
  localhost/free-deepseek-api:local
```

Dentro do container, `NON_INTERACTIVE=1`, `HOST=0.0.0.0` e os caminhos para ambos
os secrets estão pré-configurados. `REQUIRE_PROXY_API_KEY=1` impede que o container
inicie se o secret da chave estiver ausente ou vazio. No host, a porta é
publicada apenas em `127.0.0.1`; não remova este endereço sem uma política
separada de firewall/acesso de rede.

4. Verifique se está vivo, se a conta está pronta e o endpoint protegido:

```bash
podman healthcheck run free-deepseek-api
curl --fail http://127.0.0.1:9655/readyz
curl --fail \
  -H "Authorization: Bearer $PROXY_API_KEY" \
  http://127.0.0.1:9655/v1/models
```

O healthcheck embutido verifica o `/health` local (se o processo está
vivo). `/readyz` adicionalmente retorna `503` se nenhuma conta de auth do DeepSeek está
pronta para atender requisições. Diagnóstico do container:

```bash
podman logs free-deepseek-api
podman inspect --format '{{.State.Health.Status}}' free-deepseek-api
```

Pare e remova o container junto com os secrets salvos do Podman:

```bash
podman stop free-deepseek-api
podman rm free-deepseek-api
podman secret rm free-deepseek-auth free-deepseek-proxy-key
unset PROXY_API_KEY
```

Ao rotacionar auth ou chave do proxy, substitua o secret correspondente e recrie
o container para que o comportamento não dependa da versão do Podman.

---

## 🩺 Diagnóstico / doctor

```bash
npm run doctor
# sem requisições de rede para o DeepSeek:
npm run doctor -- --offline
```

`doctor` verifica:

- se `deepseek-auth.json` / `DEEPSEEK_AUTH_DIR` é encontrado;
- se o JSON é válido;
- se `token`, `cookie`, `wasmUrl` existem;
- se as permissões do arquivo são seguras no macOS/Linux (`0600`);
- em execução normal — se o endpoint PoW do DeepSeek está acessível.

Se você vir `data.biz_data is null`, `fetch failed`, `401/403/429` ou o Hermes/OpenCode não enxerga os modelos — primeiro execute `npm run doctor`.

---

## ♻️ Reutilização de sessão e reset de chat

A FreeDeepseekAPI não cria um novo chat do DeepSeek a cada requisição HTTP sem motivo. A lógica é:

- um `x-agent-session`, `session` ou `user` → uma sessão de chat do DeepSeek;
- se o id da sessão já existe — o proxy reutiliza e continua a cadeia via `parent_message_id`;
- reset automático acontece por TTL, erro de sessão do DeepSeek ou cadeia de mensagens muito longa;
- o histórico local é salvo como contexto curto para que uma nova sessão do DeepSeek possa continuar a conversa.
- requisições longas de agentes são cortadas antes do envio via `DEEPSEEK_MAX_PROMPT_CHARS` (padrão 80.000 caracteres): o início da tarefa, resultados recentes de ferramentas e o adaptador de ferramentas são preservados;
- se o cliente já enviou histórico multi-turno, o histórico de recuperação local não é adicionado uma segunda vez;
- respostas vazias são re-tentadas até `DEEPSEEK_MAX_RETRIES` vezes (padrão 2), com redução de contexto a cada tentativa.

Definir agente/sessão explicitamente:

```bash
curl -X POST http://localhost:9655/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "x-agent-session: my-agent" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"Oi"}]}'
```

Ver sessões ativas:

```bash
curl http://localhost:9655/v1/sessions
```

Resetar uma única sessão:

```bash
curl -X POST "http://localhost:9655/reset-session?agent=my-agent"
```

Resetar todas as sessões:

```bash
curl -X POST "http://localhost:9655/reset-session?agent=all"
```

Limpar sessões ao reiniciar o servidor:

```bash
# Iniciar servidor com sessões limpas (contexto limpo a cada reinício)
DEEPSEEK_CLEAR_SESSIONS_ON_START=1 npm start
```

Isso deleta `sessions.json` na inicialização, então o modelo começa sem memória de conversas anteriores. Útil para desenvolvimento/testes quando você quer contexto limpo a cada reinício.

Debug de carregamento de ferramentas:

```bash
# Registrar todos os nomes de ferramentas MCP carregadas por agente (para debug)
DEEPSEEK_LOG_TOOLS=1 npm start
```

Mostra quais ferramentas estão sendo enviadas pelo cliente e cacheadas pelo servidor. Desabilitado por padrão.

Por que chats ainda aparecem no DeepSeek Web: o proxy funciona através da API Web Chat interna, e o DeepSeek armazena sessões de chat reais do lado deles. Isso é normal para um web-proxy. O objetivo da reutilização de sessão é não criar novos chats desnecessariamente e resetar de forma limpa apenas quando a cadeia ficou obsoleta/quebrada.

---

## 👥 Pool de múltiplas contas

Você pode conectar múltiplos arquivos de auth. Modelo correto: conta fixa por agente/sessão — o proxy não troca de conta dentro de uma sessão ativa do DeepSeek. Se uma conta receber `401/403/429` e entrar em cooldown, a sessão é resetada com segurança e uma nova requisição pode mudar para outra conta disponível.

Opção 1 — diretório com arquivos de auth:

```bash
mkdir -p accounts
cp deepseek-auth-main.json accounts/main.json
cp deepseek-auth-backup.json accounts/backup.json
chmod 600 accounts/*.json
DEEPSEEK_AUTH_DIR=./accounts NON_INTERACTIVE=1 npm start
```

Opção 2 — lista de arquivos:

```bash
DEEPSEEK_AUTH_PATH="./accounts/main.json,./accounts/backup.json" NON_INTERACTIVE=1 npm start
```

Como o pool funciona:

- novo agente/sessão recebe uma conta disponível em round-robin;
- a conta selecionada é fixada na sessão (`sticky`);
- em `401`, `403`, `429` a conta entra em cooldown;
- se a sessão da conta fixada entrou em cooldown, a sessão antiga do DeepSeek é resetada para evitar sobrecarregar conta com rate-limit/expirada;
- status da conta visível em `/health` sem caminhos ou nomes de arquivos de auth;
- arquivos de auth devem ser armazenados com permissões `0600`.

Configurar cooldown:

```bash
DEEPSEEK_ACCOUNT_COOLDOWN_MS=600000 npm start
```

---

## 🔑 Ideias de autenticação via console

O fluxo de senha do PR #3 pode ser feito, mas é mais seguro não armazenar a senha e não torná-lo padrão. Implementação normal:

1. `npm run auth:console` pede email/telefone e senha via prompt oculto.
2. A senha permanece apenas na memória do processo, não é escrita em arquivos/logs/histórico.
3. O script replica o fluxo de login Web via `fetch`/CDP: obtém desafio captcha/verificação, fornece link/código humano, aguarda confirmação.
4. Após login bem-sucedido, apenas o `deepseek-auth.json` no formato padrão é salvo.
5. Se o DeepSeek pedir captcha/2FA — o script honestamente diz "abra o link, passe a verificação, pressione Enter", não tenta burlar a proteção.
6. Para VPS melhor modo `auth:console --no-save-password --output deepseek-auth.json`.

MVP mínimo seguro: auth via console apenas interativo, sem senha via env. Variante de automação aceitável: `DEEPSEEK_EMAIL=... npm run auth:console`, mas a senha ainda é inserida via prompt oculto.

---

## ✅ Verificar se funciona

```bash
curl http://localhost:9655/
curl http://localhost:9655/v1/models
curl http://localhost:9655/v1/model-capabilities
```

Se tudo estiver bem, `/health` retorna o status do servidor, lista de aliases suportados e `config_ready: true`.

---

## 📋 Exemplos de requisições

### Chat Completions

```bash
curl -X POST http://localhost:9655/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Oi! Responda com uma frase."}],
    "stream": false
  }'
```

### Raciocínio

```bash
curl -X POST http://localhost:9655/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-reasoner",
    "messages": [{"role": "user", "content": "Resolva brevemente: por que o céu é azul?"}],
    "stream": false
  }'
```

Para modelos de raciocínio, a API retorna a cadeia de raciocínio separada da resposta final:

- sem stream: `choices[0].message.reasoning_content`
- stream: `choices[0].delta.reasoning_content`
- uso: `usage.completion_tokens_details.reasoning_tokens`

`reasoning_tokens` — estimativa aproximada baseada no texto `THINK` extraído do DeepSeek Web, porque o stream web não retorna uso oficial de tokens para raciocínio separadamente.

### Busca web

```bash
curl -X POST http://localhost:9655/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat-search",
    "messages": [{"role": "user", "content": "Encontre um fato recente sobre o DeepSeek e responda brevemente."}],
    "stream": false
  }'
```

### Streaming

```bash
curl -N -X POST http://localhost:9655/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Escreva uma piada curta."}],
    "stream": true
  }'
```

### Anthropic Messages API

```bash
curl -X POST http://localhost:9655/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "max_tokens": 512,
    "messages": [{"role": "user", "content": "Responda exatamente OK"}],
    "stream": false
  }'
```

Para o Claude Code você pode especificar o backend diretamente:

```bash
export ANTHROPIC_BASE_URL="http://127.0.0.1:9655"
export ANTHROPIC_AUTH_TOKEN="dummy-key"
export CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1
claude --model deepseek-chat
```

### OpenAI Responses API

```bash
curl -X POST http://localhost:9655/v1/responses \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "input": "Responda exatamente OK",
    "stream": false
  }'
```

### Chamada de ferramentas

A FreeDeepseekAPI aceita:

- `tools` da OpenAI;
- `tools` da Anthropic;
- function tools da Responses API.

O proxy pede ao DeepSeek para retornar chamada de ferramenta em JSON estrito, mas também analisa formatos de fallback:

- `TOOL_CALL:`
- JSON com cercas com envelope explícito `tool_call`, `tool_calls` ou `function_call`
- `<tool_call>...</tool_call>`
- DeepSeek DSML (`<｜DSML｜tool_calls>...`) e variante web com `<｜｜DSML｜｜ Tool Calls>`

---

## 🤖 Modelos

`GET /v1/models` retorna apenas aliases que estão atualmente verificados e funcionando através deste proxy.

### Aliases funcionais

| Alias | Modo web | Raciocínio | Busca web | Notas |
| --- | --- | --- | --- | --- |
| `deepseek-chat` | `Fast` / `default` | não | não | chat básico |
| `deepseek-v3` | `Fast` / `default` | não | não | alias de compatibilidade |
| `deepseek-default` | `Fast` / `default` | não | não | alias de compatibilidade |
| `deepseek-reasoner` | `Fast` / `default` | sim | não | `thinking_enabled=true` |
| `deepseek-r1` | `Fast` / `default` | sim | não | alias compatível com R1 |
| `deepseek-chat-search` | `Fast` / `default` | não | sim | busca web |
| `deepseek-default-search` | `Fast` / `default` | não | sim | alias de busca web |
| `deepseek-reasoner-search` | `Fast` / `default` | sim | sim | raciocínio + busca |
| `deepseek-r1-search` | `Fast` / `default` | sim | sim | compatível com R1 + busca |
| `deepseek-expert` | `Expert` / `expert` | não | não | modo Expert |
| `deepseek-v4-pro` | `Expert` / `expert` | sim | não | Expert + raciocínio |

Mapeamento completo:

```bash
curl http://localhost:9655/v1/model-capabilities
```

De acordo com a página oficial do DeepSeek V4 Preview, `deepseek-chat` e `deepseek-reasoner` são atualmente roteados para `deepseek-v4-flash` sem raciocínio/com raciocínio. No stream direto do `chat.deepseek.com` o nome exato do checkpoint não é retornado (`model: ""`), então o proxy registra tanto o modo web (`default` / `Fast`) quanto o roteamento oficial atual (`DeepSeek-V4-Flash`).

A configuração remota atual do DeepSeek Web mostra estes modos web:

- `default` / UI `Fast` — funciona; suporta `thinking_enabled` e `search_enabled`.
- `expert` / UI `Expert` — funciona via o contrato web atual (`x-client-version=2.0.0`) e suporta `thinking_enabled`. Em `/v1/models`, `deepseek-expert` é servido sem raciocínio e `deepseek-v4-pro` como Expert + raciocínio.
- `vision` / UI `Recognition` — visível na configuração remota, mas atualmente a Web API direta retorna `backend_err_by_model` (`Vision is temporarily unavailable`). Portanto, `deepseek-vision` está oculto de `/v1/models`.

Busca para Expert não está disponível na configuração remota, então `deepseek-expert-search` permanece sem suporte.

---

## 📡 Endpoints

| Método | Caminho | Finalidade |
| --- | --- | --- |
| `GET` | `/` ou `/health` | status do proxy |
| `GET` | `/v1/models` | lista de aliases compatíveis com OpenAI funcionais |
| `GET` | `/v1/model-capabilities` | mapeamento completo de alias, modelo real, capacidades |
| `POST` | `/v1/chat/completions` | Chat Completions compatível com OpenAI |
| `POST` | `/v1/messages` | Shim da Anthropic Messages API |
| `POST` | `/v1/responses` | Shim da OpenAI Responses API |
| `GET` | `/v1/sessions` | sessões de agente locais ativas |
| `POST` | `/reset-session?agent=<id>` | resetar uma única sessão |
| `POST` | `/reset-session?agent=all` | resetar todas as sessões |

---

## 🖥️ Open WebUI

URL base para Open WebUI no Docker:

```text
http://host.docker.internal:9655/v1
```

Para inicialização local sem Docker:

```text
http://localhost:9655/v1
```

Se `PROXY_API_KEY` não estiver definida, qualquer chave de API pode ser usada. Se a chave estiver definida,
o cliente deve enviar exatamente esse valor — o proxy verifica o bearer token
antes de conceder acesso a modelos, sessões e completions.

---

## 🔄 Atualizar login

```bash
npm run auth
npm start
```

Se o DeepSeek começar a retornar `401`, `403` ou pedir um novo PoW/sessão — re-execute `npm run auth` para atualizar a sessão do navegador salva.

Arquivos de auth locais não devem ser commitados no GitHub:

- `deepseek-auth.json`
- `.chrome-profile-deepseek/`
- `.env`

Eles já estão no `.gitignore`.

---

## 🧪 Testes

Verificação de sintaxe do projeto:

```bash
npm test
```

Smoke tests ao vivo contra um proxy local em execução:

```bash
BASE_URL=http://127.0.0.1:9655 MODEL=deepseek-chat npm run test:live
```

---

## 📊 Status do projeto

FreeDeepseekAPI é um proxy experimental de chat web para uso local e integrações. Ele depende do contrato atual do DeepSeek Web Chat, então quando o DeepSeek faz mudanças, a lógica de auth/sessão ou o mapeamento de modelos podem precisar de atualização.

Se algo parar de funcionar:

1. atualize o login via `npm run auth`;
2. verifique `/v1/model-capabilities`;
3. tente novamente a requisição em uma sessão nova;
4. se o problema persistir — o DeepSeek provavelmente mudou a API Web interna.

---

<p align="center">
  <strong>ForgetMeAI</strong> · <a href="https://t.me/forgetmeai">Telegram</a>
</p>
 
 # #   =ػ�  U s o   c o m   K i l o   C o d e  
  
 P a r a   u s a r   o   K i l o   C o d e   c o m   o   p r o x y   F r e e D e e p s e e k A P I   s e m   e n f r e n t a r   o   e r r o   d e   c e r t i f i c a d o   a u t o  a s s i n a d o ,   e x e c u t e   u m   d o s   s c r i p t s   d e   i n i c i a l i z a � � o   f o r n e c i d o s :  
  
 -   * * W i n d o w s : * *   ` s t a r t - k i l o . b a t `  
 -   * * L i n u x / m a c O S / G i t   B a s h : * *   ` s t a r t - k i l o . s h `  
  
 E s s e s   s c r i p t s   d e f i n e m   a   v a r i � v e l   d e   a m b i e n t e   ` N O D E _ E X T R A _ C A _ C E R T S `   a p o n t a n d o   p a r a   o   ` c e r t . p e m `   i n c l u i d o   n o   p r o j e t o ,   p e r m i t i n d o   q u e   o   N o d e . j s   u s a d o   p e l o   K i l o   C o d e   c o n f i e   n o   c e r t i f i c a d o   g e r a d o   l o c a l m e n t e .  
  
 D e p o i s   d e   e x e c u t a r   o   s c r i p t ,   o   K i l o   C o d e   s e r �   a b e r t o   n a   p a s t a   d o   p r o j e t o   e   j �   e s t a r �   c o n f i g u r a d o   p a r a   s e   c o n e c t a r   a o   e n d p o i n t   ` h t t p s : / / 1 9 2 . 1 6 8 . 1 . 2 0 : 9 6 5 5 / v 1 `   u s a n d o   o   m o d e l o   ` d e e p s e e k - c h a t `   ( o u   o u t r o   d e   s u a   e s c o l h a ) .  
  
 >   * * O b s e r v a � � o : * *   S e   v o c �   p r e f e r i r   i n i c i a r   o   K i l o   C o d e   m a n u a l m e n t e ,   b a s t a   d e f i n i r   a   v a r i � v e l   a n t e s   d e   l a n � �  l o :  
 >    
 >   ` ` ` p o w e r s h e l l  
 >   $ e n v : N O D E _ E X T R A _ C A _ C E R T S   =   " c a m i n h o \ p a r a \ c e r t . p e m "  
 >   c o d e   .  
 >   ` ` `  
 >    
 >   o u   n o   b a s h :  
 >    
 >   ` ` ` b a s h  
 >   e x p o r t   N O D E _ E X T R A _ C A _ C E R T S = " $ ( p w d ) / c e r t . p e m "  
 >   c o d e   .  
 >   ` ` `  
  
 