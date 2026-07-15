import { AppHeader } from "@/components/layout/AppHeader";
import { TabsNav } from "@/components/layout/TabsNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AppHeader />
      <TabsNav />
      <main
        style={{
          maxWidth: "var(--layout-max-width)",
          margin: "0 auto",
          padding: "18px 40px 48px",
        }}
      >
        {children}
      </main>
    </div>
  );
}
