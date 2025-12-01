import { Navbar } from "@/components/navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground select-none">
      <Navbar />
      <main className="flex-1 min-h-0 flex flex-co p-2">{children}</main>
    </div>
  );
}
