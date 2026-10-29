import { RegisterForm } from "@/components/forms/auth-forms";

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Create an account</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">Student registration only. Administrator accounts are created separately.</p>
      <RegisterForm />
    </div>
  );
}
