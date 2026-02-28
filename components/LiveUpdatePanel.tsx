"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Broadcast, CloudSlash, Link, Pulse } from "@phosphor-icons/react";
import { pick, type Language } from "@/lib/i18n";
import type { LiveMessage } from "@/lib/types";
import { UnverifiedBadge } from "@/components/UnverifiedBadge";

interface LiveUpdatePanelProps {
  language: Language;
}

export const LiveUpdatePanel = memo(function LiveUpdatePanel({ language }: LiveUpdatePanelProps) {
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "fallback" | "error">("connecting");
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const pollingTimer = useRef<NodeJS.Timeout | null>(null);

  const endpoint = useMemo(() => `/api/live/messages?lang=${language}&limit=30`, [language]);
  const streamEndpoint = useMemo(() => `/api/live/stream?lang=${language}`, [language]);

  useEffect(() => {
    let cancelled = false;

    const clearPolling = () => {
      if (pollingTimer.current) {
        clearInterval(pollingTimer.current);
        pollingTimer.current = null;
      }
    };

    const startPolling = () => {
      clearPolling();
      pollingTimer.current = setInterval(() => {
        void pullOnce();
      }, 10000);
    };

    async function pullOnce() {
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const json = (await response.json()) as { data: LiveMessage[] };
        if (!cancelled) {
          setMessages(json.data);
          setIsLoading(false);
          setErrorText(null);
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setErrorText(pick(language, "实时数据获取失败，正在重试。", "Live data fetch failed, retrying."));
          setIsLoading(false);
        }
      }
    }

    void pullOnce();

    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      setStatus("fallback");
      startPolling();
      return () => {
        cancelled = true;
        clearPolling();
      };
    }

    const eventSource = new EventSource(streamEndpoint);

    eventSource.addEventListener("init", (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as { messages: LiveMessage[] };
      setMessages(payload.messages);
      setStatus("live");
      setIsLoading(false);
      setErrorText(null);
    });

    eventSource.addEventListener("update", (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as { messages: LiveMessage[] };
      setMessages(payload.messages);
      setStatus("live");
      setErrorText(null);
      setIsLoading(false);
    });

    eventSource.onerror = () => {
      setStatus("fallback");
      eventSource.close();
      startPolling();
    };

    return () => {
      cancelled = true;
      eventSource.close();
      clearPolling();
    };
  }, [endpoint, streamEndpoint, language]);

  return (
    <section className="dense-block overflow-hidden">
      <header className="signal-line flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <Pulse size={15} weight="duotone" className="text-teal-700" />
          <h2 className="text-sm font-semibold tracking-[0.08em] uppercase">
            {pick(language, "实时情报流", "Real-time Intelligence Feed")}
          </h2>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-600">
          <motion.span
            className="live-dot"
            animate={{ scale: [1, 1.16, 1] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          />
          {status === "live"
            ? pick(language, "实时", "Live")
            : status === "fallback"
              ? pick(language, "轮询", "Polling")
              : status === "error"
                ? pick(language, "错误", "Error")
                : pick(language, "连接中", "Connecting")}
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-2 px-3 py-3">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="h-11 animate-pulse rounded border border-slate-200 bg-slate-100" />
          ))}
        </div>
      ) : null}

      {errorText ? (
        <div className="signal-line flex items-center gap-2 px-3 py-2 text-xs text-amber-700">
          <CloudSlash size={14} />
          <span>{errorText}</span>
        </div>
      ) : null}

      {!isLoading && messages.length === 0 ? (
        <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-500">
          <Broadcast size={14} />
          <span>{pick(language, "当前无可展示的实时消息", "No live messages available at the moment")}</span>
        </div>
      ) : null}

      <ul className="max-h-[28rem] divide-y overflow-y-auto">
        <AnimatePresence initial={false} mode="popLayout">
          {messages.map((message) => (
            <motion.li
              layout
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="space-y-1 px-3 py-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Broadcast size={13} className="text-teal-700" />
                  {message.source_id || pick(language, "系统", "System")}
                </span>
                <UnverifiedBadge status={message.verification_status} language={language} />
              </div>
              <p className="leading-5 text-slate-700">{message.text}</p>
              <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-slate-500">
                <span>{message.timestamp}</span>
                {message.source_url ? (
                  <a className="inline-flex items-center gap-1 text-teal-700 underline" href={message.source_url} target="_blank" rel="noreferrer">
                    <Link size={12} />
                    {pick(language, "来源", "Source")}
                  </a>
                ) : null}
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
});
