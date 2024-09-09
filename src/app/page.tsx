"use client";

import { useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";

type Message = {
  role: string;
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);

  const [message, setMessage] = useState("");

  const handleSendMessage = async () => {
    const userMessage = { role: "user", content: message };
    const latestMessage = { role: "assistant", content: "" };

    setMessage("");

    const newMessages = [...messages, userMessage];
    setMessages([...newMessages, latestMessage]);

    await fetchEventSource("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: newMessages,
      }),
      onmessage(ev) {
        latestMessage.content += ev.data;

        setMessages([...messages, latestMessage]);
      },
      async onopen() {
        console.log("connected");
      },
      onclose() {
        console.log("closed");
      },
      onerror(err) {
        console.error(err);
      },
    });
  };

  return (
    <div>
      <div>
        {messages.map((message, index) => (
          <div key={index}>
            <span>{message.role}</span>
            <span>{message.content}</span>
          </div>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(ev) => setMessage(ev.target.value)}
      />
      <button onClick={() => handleSendMessage()}>Send</button>
    </div>
  );
}
