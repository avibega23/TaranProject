import { Suspense } from "react";
import { LoginForm } from "@/components/forms/auth-forms";

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Sign in</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">Use the college email you registered with.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
