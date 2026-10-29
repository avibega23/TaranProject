"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/browse", label: "Browse Items" },
  { href: "/#how-it-works", label: "How It Works" },
];

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-border bg-[#FAFAF8]/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-medium tracking-tight">
          FindIt
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {loading ? null : user ? (
            <>
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost" }))}>
                Dashboard
              </Link>
              <Button type="button" variant="outline" onClick={() => void logout()}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }))}>
                Sign In
              </Link>
              <Link href="/register" className={cn(buttonVariants())}>
                Get Started
              </Link>
            </>
          )}
        </div>
        <Button type="button" variant="outline" size="icon" className="md:hidden" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Open menu">
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open ? (
        <div className="space-y-3 border-t border-border px-4 py-4 md:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block text-sm" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/dashboard" className="block text-sm" onClick={() => setOpen(false)}>
                Dashboard
              </Link>
              <Button type="button" variant="outline" onClick={() => void logout()}>
                Sign out
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className={cn(buttonVariants({ variant: "outline" }))} onClick={() => setOpen(false)}>
                Sign In
              </Link>
              <Link href="/register" className={cn(buttonVariants())} onClick={() => setOpen(false)}>
                Get Started
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </header>
  );
}
