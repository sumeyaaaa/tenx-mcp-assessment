// Tenx MCP Analysis Server - compatible with multiple SDK versions
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const fs = require('fs');
const path = require('path');

// Create logs directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file
const logFile = path.join(logsDir, 'tenx-logs.jsonl');

// Initialize server
const server = new Server(
  { name: 'Tenx MCP Analysis Server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Compatibility shim for registering tools
if (typeof server.tool !== 'function') {
  server.tool = function (name, schema, handler) {
    if (typeof server.registerTool === 'function') return server.registerTool(name, schema, handler);
    if (typeof server.register === 'function') return server.register(name, schema, handler);
    if (typeof server.addTool === 'function') return server.addTool(name, schema, handler);

    server._tools = server._tools || {};
    server._tools[name] = { schema, handler };
    console.warn(`Warning: using local fallback for tool registration: ${name}`);
    return { name };
  };
}

// Schemas
const passageOfTimeSchema = {
  type: 'object',
  properties: {
    developer_id: { type: 'string' },
    primary_intent: { type: 'string' },
    conversation_summary: { type: 'string' },
    instruction_clarity: { type: 'number', minimum: 1, maximum: 5 },
    context: { type: 'number', minimum: 1, maximum: 5 },
    turns: { type: 'number' },
    context_changes: { type: 'number' },
    competencies: { type: 'array', items: { type: 'string' } }
  },
  required: ['developer_id', 'primary_intent', 'conversation_summary']
};

const performanceSchema = {
  type: 'object',
  properties: {
    developer_id: { type: 'string' },
    performance_category: { type: 'string', enum: ['efficient', 'inefficient', 'stalled'] },
    summary: { type: 'string' },
    user_feedback: { type: 'string' },
    task_intent: { type: 'string' },
    task_summary: { type: 'string' },
    prompt_clarity: { type: 'number', minimum: 1, maximum: 5 },
    context_provided: { type: 'number', minimum: 1, maximum: 5 },
    turn_count: { type: 'number' }
  },
  required: ['developer_id', 'performance_category', 'summary']
};

// Register tools
server.tool('log_passage_of_time', passageOfTimeSchema, async (args) => {
  console.log('📊 PASSAGE OF TIME:', { developer: args.developer_id, intent: args.primary_intent });
  const entry = { timestamp: new Date().toISOString(), type: 'passage_of_time', data: args };
  fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
  return { content: [{ type: 'text', text: `✅ Passage of time logged for ${args.developer_id}` }] };
});

server.tool('log_performance_schema', performanceSchema, async (args) => {
  const emoji = args.performance_category === 'efficient' ? '🚀' : (args.performance_category === 'inefficient' ? '🐌' : '🛑');
  console.log(`${emoji} PERFORMANCE SCHEMA:`, { developer: args.developer_id, category: args.performance_category });
  const entry = { timestamp: new Date().toISOString(), type: 'performance_schema', data: args };
  fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
  return { content: [{ type: 'text', text: `${emoji} Performance schema logged: ${args.performance_category}` }] };
});

// Optional tools/list using local map
if (server._tools) {
  server.tool('tools/list', { type: 'object' }, async () => ({ tools: Object.keys(server._tools).map((n) => ({ name: n, inputSchema: server._tools[n].schema })) }));
}

// Start
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('✅ Tenx MCP Analysis Server running on stdio');
}

main().catch((err) => { console.error('❌ Server error:', err); process.exit(1); });