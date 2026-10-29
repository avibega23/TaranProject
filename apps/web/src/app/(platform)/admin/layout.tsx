"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/items", label: "Reports" },
  { href: "/admin/claims", label: "Claims" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && user && user.role !== "admin") router.replace("/dashboard");
  }, [loading, user, router]);

  if (loading || !user || user.role !== "admin") {
    return <p className="text-sm text-muted-foreground">Checking administrator access...</p>;
  }

  return (
    <div className="space-y-6">
      <nav className="flex gap-2">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} className={cn(buttonVariants({ variant: active ? "secondary" : "outline", size: "sm" }))}>
              {link.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
