import { NextRequest } from "next/server";

import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { AIMessage, ChatMessage, HumanMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

export async function POST(req: NextRequest) {
  const model = new ChatOpenAI(
    { apiKey: "sk-123", model: "gpt-4o" },
    { baseURL: "https://copilot.toandev.space/v1" }
  );

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant."],
    new MessagesPlaceholder("chat_history"),
    ["user", "{input}"],
  ]);

  const llm = prompt.pipe(model).pipe(new StringOutputParser());

  const { messages } = (await req.json()) as {
    messages: { role: string; content: string }[];
  };

  const previousMessages = messages.map((message) => {
    switch (message.role) {
      case "assistant":
        return new AIMessage(message.content);

      case "user":
        return new HumanMessage(message.content);

      default:
        return new ChatMessage(message.content, message.role);
    }
  });
  const lastMessage = previousMessages[previousMessages.length - 1];

  const stream = await llm.stream({
    chat_history: previousMessages.slice(0, previousMessages.length - 1),
    input: lastMessage.content,
  });

  const encoder = new TextEncoder();
  const customReadable = new ReadableStream({
    async start(controller) {
      for await (const message of stream) {
        if (message !== "") {
          controller.enqueue(encoder.encode(`data: ${message}\n\n`));
        }
      }

      controller.close();
    },
  });

  return new Response(customReadable, {
    headers: {
      Connection: "keep-alive",
      "Content-Encoding": "none",
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/event-stream; charset=utf-8",
    },
  });
}
