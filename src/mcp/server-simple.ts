#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { renderProject } from '../core/engine/renderer.js';
import { readFile } from 'fs/promises';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('mcp-server');

const server = new Server(
  {
    name: 'autovid-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'create_video',
      description: 'Create a video from a JSON project specification',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the project JSON file',
          },
          outputPath: {
            type: 'string',
            description: 'Path where the video should be saved',
          },
        },
        required: ['projectPath', 'outputPath'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'create_video') {
    try {
      const { projectPath, outputPath } = request.params.arguments as any;
      
      const projectData = await readFile(projectPath, 'utf-8');
      const project = JSON.parse(projectData);
      
      const result = await renderProject(project, {
        outputPath,
        onProgress: (progress) => {
          logger.info({ progress: progress.percentage }, 'Rendering');
        },
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              outputPath: result,
              message: 'Video created successfully',
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: `Unknown tool: ${request.params.name}`,
      },
    ],
    isError: true,
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('AutoVid MCP Server ready');
}

main().catch(logger.error);
