import { KeyboardNav } from "@/components/shell/KeyboardNav";
import { MobileNav, Sidebar } from "@/components/shell/Nav";
import { SetupNotice } from "@/components/shell/SetupNotice";
import { getShellInfo } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let info: Awaited<ReturnType<typeof getShellInfo>>;
  try {
    info = await getShellInfo();
  } catch (error) {
    return <SetupNotice message={error instanceof Error ? error.message : String(error)} />;
  }
  return (
    <div className="flex min-h-dvh">
      <KeyboardNav />
      <Sidebar dayNumber={info.dayNumber} streak={info.streak} />
      <div className="min-w-0 flex-1">
        <MobileNav />
        <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">{children}</main>
      </div>
    </div>
  );
}
