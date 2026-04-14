import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-semibold">
              Engram Hiring
            </Link>
            <nav className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">Pipeline</Link>
              <Link href="/pool" className="hover:text-foreground">Follow-up pool</Link>
              <Link href="/positions" className="hover:text-foreground">Positions</Link>
              <Link href="/settings" className="hover:text-foreground">Settings</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Avatar name={session.user.name} image={session.user.image} />
              <span className="hidden text-sm sm:inline">{session.user.name}</span>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="text-xs text-muted-foreground hover:text-foreground">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
