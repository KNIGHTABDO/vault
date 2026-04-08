/**
 * VAULT AI ROUTER
 * Decides which provider to use based on the task type.
 *
 * Gemini: multimodal, search, file analysis, summarization
 * Copilot: writing, reasoning, complex conversation
 */

export type TaskType =
  | "chat"          // General conversation
  | "writing"       // Drafting, expanding, rewriting
  | "search"        // Web search
  | "file-analysis" // Analyzing uploaded files
  | "summarize"     // Summarization
  | "reasoning"     // Complex reasoning, problem-solving
  | "extract"       // Extract memories from conversation
  | "multimodal";   // Image/audio/video analysis

export type Provider = "gemini" | "copilot";

interface RouteResult {
  provider: Provider;
  model: string;
  useSearchGrounding: boolean;
}

export function routeTask(taskType: TaskType, context?: {
  hasFiles?: boolean;
  messageCount?: number;
}): RouteResult {
  // If files are attached, always use Gemini (multimodal)
  if (context?.hasFiles) {
    return {
      provider: "gemini",
      model: "gemini-2.5-flash",
      useSearchGrounding: false,
    };
  }

  switch (taskType) {
    case "file-analysis":
    case "multimodal":
      return {
        provider: "gemini",
        model: "gemini-2.5-flash",
        useSearchGrounding: false,
      };

    case "search":
      return {
        provider: "gemini",
        model: "gemini-2.5-flash",
        useSearchGrounding: true,
      };

    case "summarize":
      return {
        provider: "gemini",
        model: "gemini-2.5-flash",
        useSearchGrounding: false,
      };

    case "extract":
      return {
        provider: "gemini",
        model: "gemini-2.5-flash",
        useSearchGrounding: false,
      };

    case "writing":
      return {
        provider: "copilot",
        model: "gpt-4o",
        useSearchGrounding: false,
      };

    case "reasoning":
      return {
        provider: "copilot",
        model: "gpt-4o",
        useSearchGrounding: false,
      };

    case "chat":
    default:
      // Long conversations → Gemini 2.5 Pro (1M context, strong reasoning)
      // Short conversations → GPT-4o via Copilot (best conversation quality)
      if (context?.messageCount && context.messageCount > 20) {
        return {
          provider: "gemini",
          model: "gemini-2.5-pro",
          useSearchGrounding: false,
        };
      }
      return {
        provider: "copilot",
        model: "gpt-4o",
        useSearchGrounding: false,
      };
  }
}
