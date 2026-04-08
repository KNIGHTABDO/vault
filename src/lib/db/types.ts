export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string | null;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: "user" | "assistant" | "system" | "tool";
          content: string;
          attachments: Json | null;
          tool_calls: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: "user" | "assistant" | "system" | "tool";
          content: string;
          attachments?: Json | null;
          tool_calls?: Json | null;
          created_at?: string;
        };
        Update: {
          content?: string;
        };
      };
      memories: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          content: string;
          source: string;
          embedding: number[] | null;
          metadata: Json;
          importance: number;
          access_count: number;
          last_accessed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          content: string;
          source: string;
          embedding?: number[] | null;
          metadata?: Json;
          importance?: number;
          access_count?: number;
          last_accessed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          metadata?: Json;
          importance?: number;
          access_count?: number;
          last_accessed_at?: string;
          updated_at?: string;
        };
      };
      files: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          mime_type: string;
          size_bytes: number;
          storage_path: string;
          gemini_file_uri: string | null;
          analysis: string | null;
          embedding: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          mime_type: string;
          size_bytes: number;
          storage_path: string;
          gemini_file_uri?: string | null;
          analysis?: string | null;
          embedding?: number[] | null;
          created_at?: string;
        };
        Update: {
          analysis?: string | null;
          gemini_file_uri?: string | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          completed: boolean;
          due_date: string | null;
          source_memory_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          completed?: boolean;
          due_date?: string | null;
          source_memory_id?: string | null;
          created_at?: string;
        };
        Update: {
          content?: string;
          completed?: boolean;
          due_date?: string | null;
        };
      };
    };
  };
}

// Helper types
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Memory = Database["public"]["Tables"]["memories"]["Row"];
export type FileRecord = Database["public"]["Tables"]["files"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
