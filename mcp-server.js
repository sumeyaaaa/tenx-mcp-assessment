// Tenx MCP Analysis Server - compatible with SDK 1.25.3
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

// Tool registry
const tools = {};

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

// Register tools in registry
tools['log_passage_of_time'] = {
  name: 'log_passage_of_time',
  description: 'Logs passage of time data for analysis',
  inputSchema: passageOfTimeSchema,
  handler: async (args) => {
    try {
      console.error('📊 PASSAGE OF TIME:', { developer: args.developer_id, intent: args.primary_intent });
      const entry = { timestamp: new Date().toISOString(), type: 'passage_of_time', data: args };
      fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
      return { content: [{ type: 'text', text: `✅ Passage of time logged for ${args.developer_id}` }] };
    } catch (error) {
      console.error('Error in log_passage_of_time:', error);
      return { 
        content: [{ type: 'text', text: `❌ Error: ${error.message}` }],
        isError: true 
      };
    }
  }
};

tools['log_performance_schema'] = {
  name: 'log_performance_schema',
  description: 'Logs performance schema data for analysis',
  inputSchema: performanceSchema,
  handler: async (args) => {
    try {
      const emoji = args.performance_category === 'efficient' ? '🚀' : (args.performance_category === 'inefficient' ? '🐌' : '🛑');
      console.error(`${emoji} PERFORMANCE SCHEMA:`, { developer: args.developer_id, category: args.performance_category });
      const entry = { timestamp: new Date().toISOString(), type: 'performance_schema', data: args };
      fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
      return { content: [{ type: 'text', text: `${emoji} Performance schema logged: ${args.performance_category}` }] };
    } catch (error) {
      console.error('Error in log_performance_schema:', error);
      return { 
        content: [{ type: 'text', text: `❌ Error: ${error.message}` }],
        isError: true 
      };
    }
  }
};

// Register tools/list handler
server.setRequestHandler('tools/list', async () => {
  return {
    tools: Object.values(tools).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  };
});

// Register tools/call handler
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  if (!tools[name]) {
    throw new Error(`Tool not found: ${name}`);
  }
  
  const tool = tools[name];
  return await tool.handler(args || {});
});

// Start
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✅ Tenx MCP Analysis Server running on stdio');
}

main().catch((err) => { 
  console.error('❌ Server error:', err); 
  process.exit(1); 
});