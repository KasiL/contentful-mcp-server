import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllPrompts } from './prompts/register.js';
import { registerAllResources } from './resources/register.js';
import { registerAllTools } from './tools/register.js';
import { VERSION } from './config/version.js';
import { z } from 'zod';

// Export configSchema for Smithery user configuration
export const configSchema = z.object({
  CONTENTFUL_MANAGEMENT_ACCESS_TOKEN: z
    .string()
    .describe('Contentful Management API access token'),
  SPACE_ID: z.string().optional().describe('Contentful Space ID'),
  ENVIRONMENT_ID: z
    .string()
    .optional()
    .default('master')
    .describe('Contentful Environment ID'),
  CONTENTFUL_HOST: z
    .string()
    .optional()
    .default('api.contentful.com')
    .describe('Contentful API host'),
  APP_ID: z.string().optional().describe('Contentful App ID'),
  ORGANIZATION_ID: z.string().optional().describe('Contentful organization ID'),
});

const MCP_SERVER_NAME = '@KasiL/contentful-mcp-server';

async function initializeServer() {
  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: VERSION,
  });

  registerAllTools(server);
  registerAllPrompts(server);
  registerAllResources(server);

  return server;
}

// Required: Export default createServer function for Smithery
export default async function createServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  // Set environment variables from config
  if (config.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN) {
    process.env.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN =
      config.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN;
  }
  if (config.SPACE_ID) {
    process.env.SPACE_ID = config.SPACE_ID;
  }
  if (config.ENVIRONMENT_ID) {
    process.env.ENVIRONMENT_ID = config.ENVIRONMENT_ID;
  }
  if (config.CONTENTFUL_HOST) {
    process.env.CONTENTFUL_HOST = config.CONTENTFUL_HOST;
  }
  if (config.APP_ID) {
    process.env.APP_ID = config.APP_ID;
  }
  if (config.ORGANIZATION_ID) {
    process.env.ORGANIZATION_ID = config.ORGANIZATION_ID;
  }

  const server = await initializeServer();

  // Return the server object (not the transport) for Smithery
  return server.server;
}

// Keep STDIO support for local development and CLI usage
// Only run if this file is executed directly (not imported by Smithery)
if (
  import.meta.url.endsWith(process.argv[1] || '') ||
  process.argv[1]?.includes('index.js')
) {
  if (process.env.NODE_ENV === 'development') {
    try {
      await import('mcps-logger/console');
    } catch {
      console.warn('mcps-logger not available in production environment');
    }
  }

  async function main() {
    try {
      const server = await initializeServer();
      const transport = new StdioServerTransport();
      await server.connect(transport);
    } catch (error) {
      console.error('Fatal error:', error);
      process.exit(1);
    }
  }

  main();
}
