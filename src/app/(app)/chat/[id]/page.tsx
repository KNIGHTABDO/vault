import { ChatInterface } from "@/components/chat/ChatInterface";

export default async function ChatByIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChatInterface conversationId={id} />;
}
