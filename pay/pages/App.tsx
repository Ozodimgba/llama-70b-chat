import React, { useEffect, useRef, useState } from "react";
import ChatForm from "@/components/ChatForm";
import Message from "@/components/Message";
import SlideOver from "@/components/SlideOver";
import EmptyState from "@/components/EmptyState";
import { Cog6ToothIcon, CodeBracketIcon } from "@heroicons/react/20/solid";
import { useCompletion } from "ai/react";

interface Version {
  name: string;
  version: string;
  shortened: string;
}

interface MessageItem {
  text: string;
  isUser: boolean;
}

const VERSIONS: Version[] = [
  {
    name: "Llama 2 7B",
    version: "d24902e3fa9b698cc208b5e63136c4e26e828659a9f09827ca6ec5bb83014381",
    shortened: "7B",
  },
  {
    name: "Llama 2 13B",
    version: "9dff94b1bed5af738655d4a7cbcdcde2bd503aa85c94334fe1f42af7f3dd5ee3",
    shortened: "13B",
  },
  {
    name: "Llama 2 70B",
    version: "2796ee9483c3fd7aa2e171d38f4ca12251a30609463dcfd4cd76703f22e96cdf",
    shortened: "70B",
  },
];

interface EmptyStateProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPrompt: (newPrompt: string) => void; // Update the type here
}

interface HomePageProps {
  // Add any props here if needed
}

function approximateTokenCount(text: string) {
  return Math.ceil(text.length * 0.4);
}

const HomePage: React.FC<HomePageProps> = () => {
  const MAX_TOKENS = 4096;
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  //   Llama params
  const [size, setSize] = useState<Version>(VERSIONS[2]); // default to 70B
  const [systemPrompt, setSystemPrompt] = useState<string>(
    "You are a helpful assistant."
  );
  const [temp, setTemp] = useState<number>(0.75);
  const [topP, setTopP] = useState<number>(0.9);
  const [maxTokens, setMaxTokens] = useState<number>(800);

  const { complete, completion, setInput, input } = useCompletion({
    api: "/api",
    body: {
      version: size.version,
      systemPrompt: systemPrompt,
      temperature: parseFloat(temp.toString()),
      topP: parseFloat(topP.toString()),
      maxTokens: parseInt(maxTokens.toString()),
    },
    onError: (error) => {
      setError(error.toString());
    },
  });

  const setAndSubmitPrompt: (newPrompt: string) => void = (newPrompt: string) => {
    handleSubmit(newPrompt);
  };
  

  const handleSettingsSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setOpen(false);

    const target = event.currentTarget as HTMLFormElement & {
      systemPrompt: { value: string };
    };

     setSystemPrompt(target.systemPrompt.value);
  };

  const handleSubmit = async (userMessage: string) => {
    const SNIP = "<!-- snip -->";

    const messageHistory = [...messages];
    if (completion.length > 0) {
      messageHistory.push({
        text: completion,
        isUser: false,
      });
    }
    messageHistory.push({
      text: userMessage,
      isUser: true,
    });

    const generatePrompt = (messages: MessageItem[]) => {
      return messages
        .map((message) =>
          message.isUser ? `[INST] ${message.text} [/INST]` : `${message.text}`
        )
        .join("\n");
    };

    // Generate initial prompt and calculate tokens
    let prompt = `${generatePrompt(messageHistory)}\n`;
    // Check if we exceed max tokens and truncate the message history if so.
    while (approximateTokenCount(prompt) > MAX_TOKENS) {
      if (messageHistory.length < 3) {
        setError(
          "Your message is too long. Please try again with a shorter message."
        );

        return;
      }

      // Remove the third message from history, keeping the original exchange.
      messageHistory.splice(1, 2);

      // Recreate the prompt
      prompt = `${SNIP}\n${generatePrompt(messageHistory)}\n`;
    }

    setMessages(messageHistory);

    console.log("temp is ", temp);

    complete(prompt);
  };

  useEffect(() => {
    if (messages?.length > 0 || completion?.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, completion]);

  return (
    <>
      <div className="bg-slate-100 border-b-2 text-center p-3">
        Powered by Replicate.{" "}
        <a
          href="https://replicate.com/blog/run-llama-2-with-an-api?utm_source=project&utm_campaign=llama2ai"
          target="_blank"
          className="underline"
        >
          Run and fine-tune Llama 2 in the cloud.
        </a>
      </div>
      <nav className="grid grid-cols-2 pt-3 pl-6 pr-3 sm:grid-cols-3 sm:pl-0">
        <div className="hidden sm:inline-block"></div>
        <div className="font-semibold text-gray-500 sm:text-center">
          🦙 <span className="hidden sm:inline-block">Chat with</span>{" "}
          <button
            className="py-2 font-semibold text-gray-500 hover:underline"
            onClick={() => setOpen(true)}
          >
            Llama 2 {size.shortened}
          </button>
        </div>
        <div className="flex justify-end">
          <a
            className="inline-flex items-center px-3 py-2 mr-3 text-sm font-semibold text-gray-700 bg-white rounded-md shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            href="https://github.com/replicate/chat"
          >
            <CodeBracketIcon
              className="w-5 h-5 text-gray-500 sm:mr-2 group-hover:text-gray-900"
              aria-hidden="true"
            />{" "}
            <span className="hidden sm:inline">Clone on GitHub</span>
          </a>
          <button
            type="button"
            className="inline-flex items-center"
            onClick={() => setOpen(true)}
          >
            <Cog6ToothIcon
              className="w-5 h-5 text-gray-500 sm:mr-2 group-hover:text-gray-900"
              aria-hidden="true"
            />{" "}
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </nav>

      <main className="max-w-2xl pb-5 mx-auto mt-4 sm:px-4">
        <div className="text-center"></div>
        {messages.length === 0 && (
          <EmptyState setPrompt={(newPrompt) => setAndSubmitPrompt(newPrompt.toString())} setOpen={setOpen} />
        )}

        <SlideOver
          open={open}
          setOpen={setOpen}
          systemPrompt={systemPrompt}
          setSystemPrompt={setSystemPrompt}
          handleSubmit={handleSettingsSubmit}
          temp={temp}
          setTemp={setTemp}
          maxTokens={maxTokens}
          setMaxTokens={setMaxTokens}
          topP={topP}
          setTopP={setTopP}
          versions={VERSIONS}
          size={size}
          setSize={setSize}
        />

        <ChatForm prompt={input} setPrompt={setInput} onSubmit={handleSubmit} />

        {error && <div>{error}</div>}

        <article className="pb-24">
          {messages.map((message, index) => (
            <Message
              key={`message-${index}`}
              message={message.text}
              isUser={message.isUser}
            />
          ))}
          <Message message={completion} isUser={false} />
          <div ref={bottomRef} />
        </article>
      </main>
    </>
  );
};

export default HomePage;
