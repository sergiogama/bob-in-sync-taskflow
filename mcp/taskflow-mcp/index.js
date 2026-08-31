#!/usr/bin/env node
/**
 * TaskFlow MCP Server
 *
 * Exposes three MCP tools for IBM Bob:
 *   - list_open_tickets
 *   - get_ticket
 *   - get_ticket_comments
 *   - start_work_on_ticket
 *
 * Authentication: POST /api/auth/login (Bearer token cached in memory).
 * Transport: STDIO.
 *
 * Environment variables:
 *   TASKFLOW_API_URL  — defaults to http://127.0.0.1:3001
 *   TASKFLOW_EMAIL    — required
 *   TASKFLOW_PASSWORD — required
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

// ── Configuration ────────────────────────────────────────────────────────────

const BASE_URL = (process.env.TASKFLOW_API_URL || 'http://127.0.0.1:3001').replace(/\/$/, '')
const EMAIL = process.env.TASKFLOW_EMAIL
const PASSWORD = process.env.TASKFLOW_PASSWORD

if (!EMAIL || !PASSWORD) {
  process.stderr.write(
    '[taskflow-mcp] TASKFLOW_EMAIL and TASKFLOW_PASSWORD environment variables are required.\n'
  )
  process.exit(1)
}

// ── Auth token cache ─────────────────────────────────────────────────────────

let cachedToken = null

async function authenticate() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`TaskFlow login failed (${res.status}): ${body}`)
  }
  const data = await res.json()
  cachedToken = data.token
  return cachedToken
}

async function getToken() {
  if (!cachedToken) await authenticate()
  return cachedToken
}

// ── Authenticated fetch with one 401 retry ───────────────────────────────────

async function apiFetch(path, { method = 'GET', body } = {}) {
  async function request(token) {
    const headers = {
      Authorization: `Bearer ${token}`,
    }

    const options = {
      method,
      headers,
    }

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
      options.body = JSON.stringify(body)
    }

    return fetch(`${BASE_URL}${path}`, options)
  }

  let token = await getToken()
  let res = await request(token)

  if (res.status === 401) {
    cachedToken = null
    token = await authenticate()
    res = await request(token)
  }

  if (!res.ok) {
    const responseBody = await res.text()
    throw new Error(`TaskFlow API error (${res.status}): ${responseBody}`)
  }

  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Accept "TF-0014" or "14" and return the numeric id */
function parseTicketId(raw) {
  const str = String(raw).trim()
  if (/^TF-\d+$/i.test(str)) {
    return parseInt(str.replace(/^TF-/i, ''), 10)
  }
  const n = parseInt(str, 10)
  if (isNaN(n)) throw new Error(`Invalid ticket_id: "${raw}". Use a number or "TF-NNNN".`)
  return n
}

/** Format a numeric id as the human-readable TF-NNNN reference */
function ticketRef(id) {
  return `TF-${String(id).padStart(4, '0')}`
}

// ── MCP Server ────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'taskflow',
  version: '1.0.0',
})

// ── Tool: list_open_tickets ───────────────────────────────────────────────────

server.tool(
  'list_open_tickets',
  'Retrieve all TaskFlow maintenance tickets whose status is OPEN. ' +
    'Returns the human-readable reference (e.g. TF-0014), numeric id, title, status, owner, and creation date.',
  {},
  async () => {
    const data = await apiFetch('/api/tickets?status=OPEN')
    const tickets = (data.tickets || []).map((t) => ({
      reference: ticketRef(t.id),
      id: t.id,
      title: t.title,
      status: t.status,
      owner: t.owner || null,
      created_at: t.created_at,
    }))
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ open_tickets: tickets, count: tickets.length }, null, 2),
        },
      ],
    }
  }
)

// ── Tool: get_ticket ──────────────────────────────────────────────────────────

server.tool(
  'get_ticket',
  'Retrieve the complete details of a single TaskFlow ticket. ' +
    'Accepts ticket_id as either a numeric id (e.g. 14) or the human-readable reference (e.g. TF-0014). ' +
    'Returns reference, id, title, description, status, owner, created_by, created_at, and updated_at.',
  { ticket_id: z.string().describe('Ticket id — numeric (14) or reference format (TF-0014)') },
  async ({ ticket_id }) => {
    const id = parseTicketId(ticket_id)
    const data = await apiFetch(`/api/tickets/${id}`)
    const t = data.ticket
    const result = {
      reference: ticketRef(t.id),
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      owner: t.owner || null,
      created_by: t.created_by,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }
    return {
      content: [{ type: 'text', text: JSON.stringify({ ticket: result }, null, 2) }],
    }
  }
)

// ── Tool: get_ticket_comments ─────────────────────────────────────────────────

server.tool(
  'get_ticket_comments',
  'Retrieve all comments for a TaskFlow ticket. ' +
    'Accepts ticket_id as either a numeric id (e.g. 14) or the human-readable reference (e.g. TF-0014). ' +
    'Returns each comment with its id, content, author name, and creation timestamp.',
  { ticket_id: z.string().describe('Ticket id — numeric (14) or reference format (TF-0014)') },
  async ({ ticket_id }) => {
    const id = parseTicketId(ticket_id)
    // GET /api/tickets/:id returns the ticket object which already includes comments[]
    const data = await apiFetch(`/api/tickets/${id}`)
    const comments = (data.ticket.comments || []).map((c) => ({
      id: c.id,
      author: c.author,
      author_id: c.author_id,
      content: c.content,
      created_at: c.created_at,
    }))
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { ticket_id: id, reference: ticketRef(id), comments, count: comments.length },
            null,
            2
          ),
        },
      ],
    }
  }
)

// ── Tool: start_work_on_ticket ────────────────────────────────────────────────

const START_WORK_COMMENT =
  'IBM Bob started working on this request through BOB IN SYNC.'

server.tool(
  'start_work_on_ticket',
  'Mark that IBM Bob has started actively working on a TaskFlow ticket. ' +
    'Assigns the ticket to IBM Bob, changes its status to IN_PROGRESS, ' +
    'and adds a start-work comment. This operation is idempotent.',
  {
    ticket_id: z
      .string()
      .describe('Ticket id — numeric (14) or reference format (TF-0014)'),
  },
  async ({ ticket_id }) => {
    const id = parseTicketId(ticket_id)

    // Retrieve the current ticket and TaskFlow users.
    const [ticketData, usersData] = await Promise.all([
      apiFetch(`/api/tickets/${id}`),
      apiFetch('/api/users'),
    ])

    const ticket = ticketData.ticket
    const users = usersData.users || []

    // Locate IBM Bob without relying on a hard-coded database id.
    const bob =
      users.find(
        (u) =>
          String(u.email || '').trim().toLowerCase() ===
          'ibm.bob@taskflow.local'
      ) ||
      users.find(
        (u) =>
          String(u.name || '').trim().toLowerCase() === 'ibm bob'
      )

    if (!bob) {
      throw new Error(
        'IBM Bob user was not found in TaskFlow. ' +
          'Expected name "IBM Bob" or email "ibm.bob@taskflow.local".'
      )
    }

    // Detect whether ownership/status already reflect active Bob work.
    const ownerAlreadyBob =
      ticket.owner_id === bob.id ||
      ticket.owner?.id === bob.id ||
      String(ticket.owner?.name || '').trim().toLowerCase() === 'ibm bob' ||
      String(ticket.owner || '').trim().toLowerCase() === 'ibm bob'

    const statusAlreadyInProgress = ticket.status === 'IN_PROGRESS'

    if (ticket.status === 'CLOSED') {
      throw new Error(
        `TaskFlow ticket ${ticketRef(id)} is closed. Only a Manager can reopen a closed ticket.`
      )
    }

    if (ticket.owner_id !== null && !ownerAlreadyBob) {
      throw new Error(
        `TaskFlow ticket ${ticketRef(id)} is already assigned to ${ticket.owner || 'another user'}. ` +
          'IBM Bob can only start work on unassigned tickets or tickets already assigned to IBM Bob.'
      )
    }

    let ticketUpdated = false
    let updatedTicket = ticket

    if (!ownerAlreadyBob || !statusAlreadyInProgress) {
      const updateData = await apiFetch(`/api/tickets/${id}`, {
        method: 'PUT',
        body: {
          title: ticket.title,
          description: ticket.description,
          status: 'IN_PROGRESS',
          category: ticket.category,
          owner_id: bob.id,
        },
      })

      updatedTicket = updateData.ticket
      ticketUpdated = true
    }

    // GET /api/tickets/:id already includes comments.
    const comments = ticket.comments || []

    const commentAlreadyExists = comments.some(
      (comment) =>
        String(comment.content || '').trim() === START_WORK_COMMENT
    )

    let commentAdded = false

    if (!commentAlreadyExists) {
      await apiFetch(`/api/tickets/${id}/comments`, {
        method: 'POST',
        body: {
          content: START_WORK_COMMENT,
        },
      })

      commentAdded = true
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              reference: ticketRef(id),
              started: true,
              owner: 'IBM Bob',
              status: 'IN_PROGRESS',
              ticket_updated: ticketUpdated,
              comment_added: commentAdded,
              message:
                'IBM Bob is now working on this request through BOB IN SYNC.',
            },
            null,
            2
          ),
        },
      ],
    }
  }
)

// ── Start ─────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport()
await server.connect(transport)
process.stderr.write('[taskflow-mcp] Server running on STDIO\n')
