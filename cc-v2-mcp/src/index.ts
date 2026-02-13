#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({
  name: 'cc-v2-code-intel',
  version: '1.0.0',
});

// Tools will be registered in subsequent tasks

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('CC v2 Code Intelligence MCP Server running on stdio');
}

main().catch(console.error);
