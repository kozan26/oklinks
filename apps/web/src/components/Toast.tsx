import { useEffect, useState } from "react";

interface ToastProps {
  message?: string;
}

export default function Toast({ message }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    // Expose show method to window
    (window as any).toastComponent = {
      show: (msg: string) => {
        setText(msg);
        setVisible(true);
        setTimeout(() => setVisible(false), 2000);
      },
    };

    // Also listen for custom events
    const handler = ((e: CustomEvent) => {
      setText(e.detail);
      setVisible(true);
      setTimeout(() => setVisible(false), 2000);
    }) as EventListener;

    window.addEventListener("toast", handler);
    return () => window.removeEventListener("toast", handler);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 right-4 bg-accent text-ink px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in"
      role="alert"
    >
      <span>✓</span>
      <span>{text}</span>
    </div>
  );
}

