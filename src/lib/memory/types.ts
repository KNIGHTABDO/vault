export interface VaultMemory {
  id: string;
  userId: string;
  type: MemoryType;
  content: string;
  source: MemorySource;
  metadata: MemoryMetadata;
  importance: number;
  accessCount: number;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type MemoryType =
  | "fact"
  | "event"
  | "preference"
  | "person"
  | "project"
  | "file"
  | "skill";

export type MemorySource = "conversation" | "upload" | "voice" | "manual";

export interface MemoryMetadata {
  date?: string;
  name?: string;
  tags?: string[];
  relatedMemoryIds?: string[];
  [key: string]: unknown;
}
