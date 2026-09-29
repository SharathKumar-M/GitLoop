import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL;

const suggestions = [
  "How does this project work?",
  "How does authentication work?",
  "Where does the data flow start?",
  "Which files handle the main logic?",
];

function getFallbackDescription(repository) {
  const description = repository?.description?.trim();

  if (description) {
    return description;
  }

  return `This is the ${repository?.name || "repository"} project. GitLoop is ready to answer questions about its actual source code and structure.`;
}

function SourceList({ sources }) {
  if (!sources?.length) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-white/5 pt-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
        Sources
      </p>

      <div className="mt-2 space-y-2">
        {sources.map((source) => (
          <div
            key={source.path}
            className="rounded-xl border border-white/10 bg-black/10 px-3 py-2"
          >
            <p className="font-mono text-[11px] text-slate-400">
              {source.path}
            </p>

            {source.reason && (
              <p className="mt-1 text-[11px] leading-5 text-slate-600">
                {source.reason}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[88%]">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-600">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-purple-400/10 bg-purple-400/[0.05] text-purple-300">
            ✦
          </span>
          GitLoop AI
        </div>

        <div className="rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.025] px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">
              Thinking
            </span>

            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-400" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssistantMessage({ item, onSpeak, speaking }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%]">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-600">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-purple-400/10 bg-purple-400/[0.05] text-purple-300">
            ✦
          </span>
          GitLoop AI
        </div>

        <div
          className={`rounded-2xl rounded-tl-md border px-4 py-4 text-sm leading-7 ${
            item.error
              ? "border-red-400/10 bg-red-400/[0.035] text-red-200/80"
              : "border-white/10 bg-white/[0.025] text-slate-300"
          }`}
        >
          <div className="whitespace-pre-wrap">
            {item.content}
          </div>

          {!item.error && (
            <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3">
              <button
                type="button"
                onClick={() => onSpeak(item.content)}
                className="rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-slate-500 transition hover:border-purple-400/15 hover:text-slate-300"
                aria-label="Read answer aloud"
              >
                {speaking ? "Stop" : "Read aloud"}
              </button>
            </div>
          )}

          {!item.error && item.provider && (
            <p className="mt-3 text-[10px] text-slate-700">
              Answered by {item.provider}
            </p>
          )}

          {!item.error && <SourceList sources={item.sources} />}
        </div>
      </div>
    </div>
  );
}

export default function AIChat({ repository, repositoryId }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [overview, setOverview] = useState("");
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [sending, setSending] = useState(false);

  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const fallbackDescription = useMemo(
    () => getFallbackDescription(repository),
    [repository]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      try {
        setLoadingOverview(true);

        const response = await fetch(
          `${API_BASE}/api/github/repositories/${repositoryId}/ai-chat/overview`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to load project overview."
          );
        }

        if (!cancelled) {
          setOverview(data.overview || "");
        }
      } catch (error) {
        console.error("AI chat overview error:", error);

        if (!cancelled) {
          setOverview("");
        }
      } finally {
        if (!cancelled) {
          setLoadingOverview(false);
        }
      }
    }

    if (repositoryId) {
      loadOverview();
    } else {
      setLoadingOverview(false);
    }

    return () => {
      cancelled = true;
    };
  }, [repositoryId]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    const supported = Boolean(SpeechRecognition);

    setVoiceSupported(supported);

    if (!supported) {
      return undefined;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      setVoiceError("");
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        transcript += event.results[index][0].transcript;
      }

      setMessage(transcript);

      window.setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);

      if (event.error === "not-allowed") {
        setVoiceError(
          "Microphone permission was blocked. Allow microphone access in your browser."
        );
      } else if (event.error === "no-speech") {
        setVoiceError("I didn't hear anything. Try again.");
      } else {
        setVoiceError("Voice input could not be started.");
      }

      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // Recognition may already be stopped.
      }

      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, sending]);

  useEffect(() => {
    if (messages.length === 0) {
      textareaRef.current?.focus();
    }
  }, [messages.length]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  function useSuggestion(value) {
    setMessage(value);
    textareaRef.current?.focus();
  }

  function toggleVoiceInput() {
    if (!voiceSupported || sending) {
      return;
    }

    setVoiceError("");

    const recognition = recognitionRef.current;

    if (!recognition) {
      setVoiceError("Voice input is not available in this browser.");
      return;
    }

    try {
      if (isListening) {
        recognition.stop();
        return;
      }

      recognition.start();
    } catch (error) {
      console.error("Voice start error:", error);
      setVoiceError(
        "Voice input could not be started. Try again."
      );
      setIsListening(false);
    }
  }

  function speakAnswer(content) {
    if (!("speechSynthesis" in window)) {
      setVoiceError(
        "Voice playback is not supported in this browser."
      );
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = "en-IN";
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  }

  async function sendMessage(event) {
    event?.preventDefault();

    const trimmed = message.trim();

    if (!trimmed || sending) {
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore if recognition is already stopping.
      }
    }

    const userMessage = {
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setMessage("");
    setSending(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/github/repositories/${repositoryId}/ai-chat`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmed,
            history: messages.slice(-8),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "GitLoop could not answer that question."
        );
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            data.answer ||
            "GitLoop could not generate an answer.",
          sources: data.sources || [],
          provider: data.provider || "",
          model: data.model || "",
        },
      ]);
    } catch (error) {
      console.error("AI chat error:", error);

      const messageText =
        error.message ||
        "Something went wrong while talking to GitLoop AI.";

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          error: true,
          content:
            messageText.includes("quota") ||
            messageText.includes("rate limit") ||
            messageText.includes("429")
              ? "GitLoop AI providers are busy right now. Please wait a little and try your message again."
              : messageText,
        },
      ]);
    } finally {
      setSending(false);

      window.setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  }

  const voiceButtonLabel = voiceSupported
    ? isListening
      ? "Stop listening"
      : "Voice input"
    : "Voice input is not supported in this browser";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-280px)] max-w-4xl flex-col">
      <div className="flex-1">
        {messages.length === 0 ? (
          <div className="flex min-h-[560px] flex-col items-center justify-center px-4 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-400/15 bg-purple-400/[0.07] text-xl text-purple-300">
              ✦
            </div>

            <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-purple-300/70">
              GitLoop AI
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              How can I help with this codebase?
            </h2>

            <div className="mt-5 max-w-2xl text-left">
              <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-slate-600">
                About this project
              </p>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4">
                <p className="text-sm leading-7 text-slate-300">
                  {loadingOverview
                    ? "GitLoop is reading the repository to understand what this project does..."
                    : overview || fallbackDescription}
                </p>
              </div>
            </div>

            <p className="mt-8 text-sm text-slate-600">
              Ask about the code, architecture, data flow, or a specific file.
            </p>

            <div className="mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => useSuggestion(item)}
                  className="rounded-xl border border-white/10 bg-white/[0.025] px-3.5 py-2.5 text-xs text-slate-400 transition hover:border-purple-400/20 hover:bg-purple-400/[0.05] hover:text-slate-200"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-7 px-1 py-8">
            {messages.map((item, index) => {
              if (item.role === "user") {
                return (
                  <div
                    key={`user-${index}`}
                    className="flex justify-end"
                  >
                    <div className="max-w-[78%] rounded-2xl rounded-br-md bg-purple-500/[0.14] px-4 py-3 text-sm leading-7 text-slate-200 ring-1 ring-purple-400/10">
                      {item.content}
                    </div>
                  </div>
                );
              }

              return (
                <AssistantMessage
                  key={`assistant-${index}`}
                  item={item}
                  onSpeak={speakAnswer}
                  speaking={
                    typeof window !== "undefined" &&
                    window.speechSynthesis?.speaking
                  }
                />
              );
            })}

            {sending && <ThinkingIndicator />}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {voiceError && (
        <div className="mb-2 px-2 text-xs text-amber-300/70">
          {voiceError}
        </div>
      )}

      {isListening && (
        <div className="mb-2 flex items-center gap-2 px-2 text-xs text-purple-300/80">
          <span className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-purple-400/50" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-purple-400" />
          </span>
          Listening...
        </div>
      )}

      <form
        onSubmit={sendMessage}
        className="sticky bottom-4 mt-4 rounded-2xl border border-white/10 bg-[#09090d]/95 p-2 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={toggleVoiceInput}
            disabled={!voiceSupported || sending}
            title={voiceButtonLabel}
            aria-label={voiceButtonLabel}
            className={`mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
              isListening
                ? "border-purple-400/30 bg-purple-400/[0.12] text-purple-200"
                : "border-white/10 bg-white/[0.02] text-slate-500 hover:border-white/15 hover:text-slate-300"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {isListening ? "■" : "◉"}
          </button>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage(event);
              }
            }}
            rows={1}
            disabled={sending}
            placeholder="Ask anything about this codebase..."
            className="max-h-36 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!message.trim() || sending}
            className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500 text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-slate-700"
            aria-label="Send message"
          >
            ↑
          </button>
        </div>

        <div className="px-3 pb-1 pt-1 text-[10px] text-slate-700">
          Enter to send · Shift + Enter for a new line
        </div>
      </form>
    </div>
  );
}
