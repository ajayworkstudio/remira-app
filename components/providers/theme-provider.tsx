"use client";

import { ThemeProvider as NextThemes } from "next-themes";
import { Toaster } from "sonner";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="top-center"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      offset={{ top: "calc(var(--safe-top) + 12px)" }}
      mobileOffset={{ top: "calc(var(--safe-top) + 12px)" }}
      toastOptions={{
        classNames: {
          toast: "!rounded-2xl !border-line !bg-surface !text-ink !shadow-card !font-sans",
          description: "!text-muted",
        },
      }}
    />
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <ThemedToaster />
    </NextThemes>
  );
}
