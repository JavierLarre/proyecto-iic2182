import { Toaster } from "sonner";
import { Navbar } from "@/components/Navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      <Toaster richColors position="top-right" toastOptions={{ duration: 2500 }} />
    </div>
  );
}
