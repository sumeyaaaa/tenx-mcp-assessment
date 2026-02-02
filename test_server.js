// test-mcp.js - Working test script for SDK 1.25.3
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function testServer() {
  console.log('🧪 Testing Tenx MCP Server (SDK 1.25.3)...\n');
  
  const client = new Client(
    {
      name: 'tenx-test-client',
      version: '1.0.0'
    },
    {
      capabilities: {}
    }
  );

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['mcp-server-final.js']
  });

  try {
    await client.connect(transport);
    
    // Initialize the connection
    console.log('1. Initializing MCP connection...');
    await client.initialize({
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'tenx-test-client',
        version: '1.0.0'
      }
    });
    console.log('✅ Connected to MCP server\n');
    
    // List tools
    console.log('2. Listing available tools...');
    const toolsResponse = await client.listTools();
    console.log('✅ Available tools:');
    toolsResponse.tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log();
    
    // Test Passage of Time tool
    console.log('3. Testing Passage of Time log...');
    const passageResult = await client.callTool({
      name: 'log_passage_of_time',
      arguments: {
        developer_id: 'tenx_assessment_user_001',
        primary_intent: 'Testing MCP server implementation',
        conversation_summary: 'Verifying that the MCP server works correctly with SDK 1.25.3',
        instruction_clarity: 5,
        context: 5,
        turns: 2,
        context_changes: 0,
        competencies: ['MCP Protocol', 'Node.js', 'Debugging']
      }
    });
    console.log('✅ Passage of Time Result:', passageResult.content[0].text);
    console.log();
    
    // Test Performance Schema tool
    console.log('4. Testing Performance Schema log...');
    const performanceResult = await client.callTool({
      name: 'log_performance_schema',
      arguments: {
        developer_id: 'tenx_assessment_user_001',
        performance_category: 'efficient',
        summary: 'Successfully implemented working MCP server',
        user_feedback: 'Server now handles MCP protocol correctly',
        task_intent: 'Fix MCP server implementation',
        task_summary: 'Updated server code to work with SDK 1.25.3 API',
        prompt_clarity: 5,
        context_provided: 5,
        turn_count: 1
      }
    });
    console.log('✅ Performance Schema Result:', performanceResult.content[0].text);
    console.log();
    
    await client.close();
    console.log('🎉 All tests passed! MCP server is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    process.exit(1);
  }
}

testServer();