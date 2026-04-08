import type { z } from "zod";
import { searchWeb } from "./web-search";
import { searchMemory, saveMemory } from "./memory-tools";
import { analyzeFileTool } from "./file-analyze";
import { createTask, listTasks } from "./task-tools";
import { readUrl } from "./url-reader";

export interface VaultTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<string>;
}

export const vaultTools: VaultTool[] = [
  {
    name: "search_web",
    description: "Search the internet for real-time information",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query" },
      },
      required: ["query"],
    },
    handler: searchWeb,
  },
  {
    name: "search_memory",
    description: "Search through the user's stored memories for relevant context",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to search for in memory" },
        type: {
          type: "string",
          description: "Filter by memory type",
          enum: ["fact", "event", "preference", "person", "project", "file"],
        },
      },
      required: ["query"],
    },
    handler: searchMemory,
  },
  {
    name: "save_memory",
    description:
      "Save an important fact, event, preference, or detail about the user",
    parameters: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The memory content to save",
        },
        type: {
          type: "string",
          description: "Type of memory",
          enum: ["fact", "event", "preference", "person", "project", "file"],
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional tags for categorization",
        },
      },
      required: ["content", "type"],
    },
    handler: saveMemory,
  },
  {
    name: "analyze_file",
    description:
      "Analyze an uploaded file (image, audio, video, PDF) using multimodal AI",
    parameters: {
      type: "object",
      properties: {
        fileId: { type: "string", description: "The file ID to analyze" },
        instruction: {
          type: "string",
          description: "What to look for in the file",
        },
      },
      required: ["fileId", "instruction"],
    },
    handler: analyzeFileTool,
  },
  {
    name: "create_task",
    description: "Create a to-do item or reminder for the user",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "The task description" },
        dueDate: {
          type: "string",
          description: "Optional due date in ISO format",
        },
      },
      required: ["content"],
    },
    handler: createTask,
  },
  {
    name: "list_tasks",
    description: "Get the user's current tasks",
    parameters: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          enum: ["all", "pending", "completed", "overdue"],
          description: "Which tasks to show",
        },
      },
    },
    handler: listTasks,
  },
  {
    name: "read_url",
    description: "Read and summarize the content of a webpage",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "The URL to read" },
      },
      required: ["url"],
    },
    handler: readUrl,
  },
];

// Convert tools to Gemini function declarations format
export function getGeminiToolDeclarations() {
  return vaultTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));
}

// Convert tools to OpenAI function format (for Copilot)
export function getOpenAIToolSchemas() {
  return vaultTools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

// Execute a tool by name
export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  const tool = vaultTools.find((t) => t.name === name);
  if (!tool) {
    return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
  try {
    return await tool.handler(args);
  } catch (error) {
    return JSON.stringify({
      error: error instanceof Error ? error.message : "Tool execution failed",
    });
  }
}
