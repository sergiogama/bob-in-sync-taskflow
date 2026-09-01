# TaskFlow MCP Server

IBM Bob can list and inspect tickets, review request readiness, and start work. `review_ticket_readiness` records `READY` or `NOT_READY`; incomplete requests receive a `NOT READY` comment. `start_work_on_ticket` automatically runs that review when needed and assigns only a ready ticket to IBM Bob.

Um servidor MCP (Model Context Protocol) **somente leitura** que permite ao IBM Bob descobrir e consultar chamados de manutenção do TaskFlow diretamente.

---

## Arquitetura

```
IBM Bob (Claude)
    │  STDIO (MCP)
    ▼
taskflow-mcp (Node.js)           ← este servidor
    │  HTTP / Bearer token
    ▼
TaskFlow REST API  (http://127.0.0.1:3001)
    │
    ▼
SQLite  (data/taskflow.db)
```

O servidor MCP é iniciado como processo filho pelo IBM Bob via transporte STDIO. Ele autentica na API REST do TaskFlow com credenciais configuradas por variáveis de ambiente, armazena o token Bearer em memória durante toda a vida útil do processo, e expõe três tools de leitura ao Bob.

---

## Instalação

```bash
cd mcp/taskflow-mcp
npm install
```

---

## Variáveis de Ambiente

| Variável             | Obrigatória | Padrão                   | Descrição                                  |
|----------------------|-------------|---------------------------|--------------------------------------------|
| `TASKFLOW_API_URL`   | Não         | `http://127.0.0.1:3001`  | URL base da API do TaskFlow                |
| `TASKFLOW_EMAIL`     | **Sim**     | —                         | E-mail da conta usada para autenticar      |
| `TASKFLOW_PASSWORD`  | **Sim**     | —                         | Senha da conta usada para autenticar       |

Copie `.env.example` para `.env` e preencha os valores:

```bash
cp .env.example .env
# edite .env com suas credenciais reais
```

O arquivo `.env` está no `.gitignore` — nunca commite credenciais reais.

---

## Como a Autenticação Funciona

1. Na primeira chamada a qualquer tool, o servidor faz `POST /api/auth/login` com `email` e `password`.
2. A API retorna `{ token, user }`. O token Bearer é armazenado em memória.
3. Todas as chamadas subsequentes enviam `Authorization: Bearer <token>`.
4. Se a API retornar HTTP 401 (token expirado ou invalidado), o servidor se autentica novamente uma única vez e reexecuta a requisição.

---

## MCP Tools Disponíveis

### `list_open_tickets`

Retorna todos os chamados com status `OPEN`.

**Parâmetros:** nenhum.

**Resposta (exemplo):**
```json
{
  "open_tickets": [
    {
      "reference": "TF-0003",
      "id": 3,
      "title": "Replace broken monitor",
      "status": "OPEN",
      "owner": "Alice",
      "created_at": "2024-01-15 09:00:00"
    }
  ],
  "count": 1
}
```

---

### `get_ticket`

Retorna os detalhes completos de um chamado.

**Parâmetros:**

| Nome        | Tipo   | Descrição                                      |
|-------------|--------|------------------------------------------------|
| `ticket_id` | string | ID numérico (`14`) ou referência (`TF-0014`)   |

**Resposta (exemplo):**
```json
{
  "ticket": {
    "reference": "TF-0014",
    "id": 14,
    "title": "Fix network switch",
    "description": "The switch on floor 3 keeps dropping connections.",
    "status": "IN_PROGRESS",
    "owner": "Bob",
    "created_by": "Alice",
    "created_at": "2024-02-01 10:00:00",
    "updated_at": "2024-02-05 14:30:00"
  }
}
```

---

### `get_ticket_comments`

Retorna todos os comentários de um chamado.

**Parâmetros:**

| Nome        | Tipo   | Descrição                                      |
|-------------|--------|------------------------------------------------|
| `ticket_id` | string | ID numérico (`14`) ou referência (`TF-0014`)   |

**Resposta (exemplo):**
```json
{
  "ticket_id": 14,
  "reference": "TF-0014",
  "comments": [
    {
      "id": 7,
      "author": "Alice",
      "author_id": 1,
      "content": "Technician scheduled for Monday.",
      "created_at": "2024-02-03 11:00:00"
    }
  ],
  "count": 1
}
```

---

## Como Executar / Testar Manualmente

### Teste de inicialização

```bash
cd mcp/taskflow-mcp
TASKFLOW_EMAIL=admin@taskflow.local TASKFLOW_PASSWORD=secret node index.js
# Deve imprimir: [taskflow-mcp] Server running on STDIO
# (e aguardar mensagens MCP no stdin)
```

### Teste com o MCP Inspector

```bash
npx @modelcontextprotocol/inspector node mcp/taskflow-mcp/index.js
```

Defina as variáveis de ambiente na interface do Inspector antes de listar as tools.

---

## Como o IBM Bob Se Conecta

O servidor está registrado em `.bob/mcp.json` (escopo de projeto) com transporte STDIO:

```json
{
  "mcpServers": {
    "taskflow": {
      "command": "node",
      "args": ["mcp/taskflow-mcp/index.js"],
      "env": {
        "TASKFLOW_API_URL": "http://127.0.0.1:3001",
        "TASKFLOW_EMAIL": "<definido no ambiente ou .env>",
        "TASKFLOW_PASSWORD": "<definido no ambiente ou .env>"
      }
    }
  }
}
```

O Bob inicia o processo automaticamente ao abrir o workspace. As três tools ficam disponíveis em todos os modos.

---

## Restrições

- Este servidor é **somente leitura**. Nenhuma tool cria, atualiza ou deleta dados no TaskFlow.
- Não modifica o código-fonte, banco de dados, frontend ou backend do TaskFlow.
