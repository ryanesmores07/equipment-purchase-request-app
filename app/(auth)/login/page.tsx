import { LoginForm } from "@/app/(auth)/login/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <section className="w-full max-w-sm rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6 grid gap-1">
          <h1 className="text-xl font-semibold text-zinc-950">
            Equipment Purchase Requests
          </h1>
          <p className="text-sm text-zinc-600">
            Sign in with a seeded employee or admin account.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
