import type { ReactNode } from "react";
import { DataProvider } from "@/components/providers/data-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { StatusBanners } from "@/components/layout/status-banners";
import { DataGate } from "@/components/layout/data-gate";
import { InAppNotifier } from "@/components/notifications/in-app-notifier";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <DataProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2">
        Skip to content
      </a>
      <Sidebar />
      <div className="md:pl-20 lg:pl-64">
        <main id="main" className="pb-nav mx-auto w-full max-w-3xl px-4 pt-[calc(var(--safe-top)+1.25rem)] md:px-8 md:pb-12 md:pt-10 xl:max-w-5xl">
          <div className="mb-4 empty:hidden">
            <StatusBanners />
          </div>
          <DataGate>{children}</DataGate>
        </main>
      </div>
      <BottomNav />
      <InAppNotifier />
    </DataProvider>
  );
}
