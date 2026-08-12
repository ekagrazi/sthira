import { ChatExperience } from "@/components/chat-experience";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <ChatExperience sessionId={sessionId} />;
}
