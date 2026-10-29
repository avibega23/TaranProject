import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF8]">
      <header className="px-4 py-5 sm:px-6">
        <Link href="/" className="font-medium tracking-tight">
          FindIt
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md border border-border bg-white p-6 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
