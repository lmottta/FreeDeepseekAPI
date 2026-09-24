# FreeDeepseekAPI — Guia de Conexão e Uso

Proxy local compatível com a API da OpenAI sobre o DeepSeek Web Chat.
Última verificação: 2026-09-24 — 11 modelos operacionais via Docker (HTTPS).

## 1. Dados de conexão

| Item | Valor |
|---|---|
| Base URL (v1) | `https://192.168.1.20:9655/v1` |
| API Key (Bearer) | `5uFfNn1oFljdeZjI4Eqb4XSLa` |
| Chat clássico | `https://192.168.1.20:9655/chat` |
| Chat2 (avançado) | `https://192.168.1.20:9655/chat2` |
| Dashboard | `https://192.168.1.20:9655/dashboard` |
| Health | `https://192.168.1.20:9655/health` |

> Na máquina do servidor, troque `192.168.1.20` por `127.0.0.1`.
> O HTTPS usa **certificado auto-assinado** (`cert.pem` na raiz do projeto).
> Com `curl`, use a flag `-k`. Ver seção 4 para IDEs.

## 2. Modelos disponíveis (11)

| ID | Tipo real | Raciocínio | Web search |
|---|---|---|---|
| `deepseek-chat` | V4 Flash (Fast) | não | não |
| `deepseek-v3` | V4 Flash (Fast) | não | não |
| `deepseek-default` | V4 Flash (Fast) | não | não |
| `deepseek-reasoner` | V4 Flash pensando | **sim** (`reasoning_content`) | não |
| `deepseek-r1` | alias do thinking | **sim** | não |
| `deepseek-chat-search` | V4 Flash | não | **sim** |
| `deepseek-default-search` | V4 Flash | não | **sim** |
| `deepseek-reasoner-search` | thinking | **sim** | **sim** |
| `deepseek-r1-search` | thinking (alias) | **sim** | **sim** |
| `deepseek-expert` | Web “Expert” | não | não |
| `deepseek-v4-pro` | Expert + thinking | **sim** | não |

Recomendado para código: `deepseek-chat` (rápido) ou `deepseek-reasoner` (qualidade).

## 3. Configurar no KiloCode (IDE)

1. Painel KiloCode → **engrenagem (Settings)** → aba **Providers**.
2. *API Provider* → **OpenAI Compatible**.
3. Preencha:
   - *Base URL*: `https://192.168.1.20:9655/v1`
   - *API Key*: `5uFfNn1oFljdeZjI4Eqb4XSLa`
   - *Model ID*: `deepseek-chat` (ou `deepseek-reasoner`)
4. Salve e teste com uma pergunta simples.

### Compatibilidade de API

- Usa o formato **Chat Completions** (`POST /v1/chat/completions`) — o que o KiloCode espera.
- Suporta `stream: true/false`, `messages[]`, `max_tokens`, `temperature`.
- Modelos thinking devolvem `reasoning_content` separado (o KiloCode ignora ou exibe conforme versão).
- Também expostos: `POST /v1/messages` (Anthropic) e `POST /v1/responses` (OpenAI Responses).

## 4. Certificado auto-assinado (importante)

O KiloCode (e SDKs) recusam HTTPS auto-assinado por padrão. Opções:

- **A — HTTP na LAN** (mais simples): peça para desativar o SSL e use
  `http://192.168.1.20:9655/v1` (requer rebuild do container).
- **B — Confiar no certificado**: importe `cert.pem` (raiz do projeto) no
  repositório de CAs confiáveis do SO onde roda a IDE.
- **C — Só para teste (inseguro)**: abra a IDE com `NODE_TLS_REJECT_UNAUTHORIZED=0`.

## 5. Testes rápidos (terminal)

```bash
KEY=5uFfNn1oFljdeZjI4Eqb4XSLa
BASE=https://192.168.1.20:9655

# Lista modelos (público desde 2026-09-24: dispensa chave, pois IDEs
# como o KiloCode consultam /v1/models sem Authorization para auto-detectar)
curl -k $BASE/v1/models

# Chat mínimo (esperado: HTTP 200 + choices[0].message.content)
curl -k -X POST $BASE/v1/chat/completions \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"Diga: ok"}],"stream":false,"max_tokens":20}'

# Streaming (esperado: linhas data: ... + data: [DONE])
curl -k -N -X POST $BASE/v1/chat/completions \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"Diga: ok"}],"stream":true}'

# Sem chave (esperado: 401 authentication_error — prova que o auth está ativo)
curl -k -X POST $BASE/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"oi"}],"stream":false}'
```

## 6. Interfaces web inclusas

| Página | Recurso |
|---|---|
| `/chat` | Chat funcional original (modelo, anexos, fork/refinar, streaming, Bearer auto) |
| `/chat2` | Layout estilo ChatGPT: sidebar + conversas, renomear/excluir, light/dark, mesmos modelos via `/v1/models` |

Ambas dispensam configuração: a chave Bearer é preenchida via `/api/proxy-key`
(localhost + redes em `PROXY_LOCAL_IPS`).

## 7. Operação Docker

```bash
cd FreeDeepseekAPI
docker compose up -d --build   # rebuild + sobe
docker compose down            # para
docker logs -f free-deepseek-api
docker ps --format '{{.Names}} {{.Status}}' | grep deepseek
```

Variáveis relevantes (`.env` / `docker-compose.yml`):

| Variável | Efeito |
|---|---|
| `PROXY_API_KEY` | chave Bearer exigida |
| `PROXY_CORS_ORIGINS` | origens de browser permitidas (ex.: `https://192.168.1.20:9655`) |
| `PROXY_LOCAL_IPS` | redes que podem auto-obter a chave (ex.: `172.16.0.0/12,192.168.1.0/24`) |
| `SSL_CERT_FILE` / `SSL_KEY_FILE` | ativa HTTPS; sem eles o servidor é HTTP |
| `DEEPSEEK_SESSION_FILE` | no container: `/app/data/sessions.json` |
| `DEEPSEEK_AUTH_PATH` | no container: secret `/run/secrets/deepseek-auth.json` |

## 8. Problemas comuns

| Sintoma | Causa provável | Ação |
|---|---|---|
| `401 authentication_error` | sem header `Authorization: Bearer` | conferir chave/base URL no cliente |
| `403 cors_error` no browser | Origin fora de `PROXY_CORS_ORIGINS` | adicionar a origem (ex.: IP da LAN) |
| `self-signed certificate` na IDE | cert próprio | seção 4 |
| `address already in use` | outro processo/container na 9655 | `docker stop free-deepseek-api` ou matar processo local |
| Resposta lenta/timeout | DeepSeek instável ou conta em cooldown | `GET /api/auth-status` (com Bearer); aguardar e repetir |
