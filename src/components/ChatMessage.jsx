import ToolResult from "./ToolResult";

function ChatMessage({ message }) {
  const isUser = message.role === "user";
  const label = isUser ? "You" : "AI";
  const content = message.content ?? "";
  const isEmpty = !content.trim();

  let body;

  if (message.toolResult) {
    body = <ToolResult result={message.toolResult} />;
  } else if (!isUser && isEmpty) {
    body = <span>Thinking...</span>;
  } else {
    body = <span>{content}</span>;
  }

  return (
    <div>
      <strong>{label}:</strong> {body}
    </div>
  );
}

export default ChatMessage;