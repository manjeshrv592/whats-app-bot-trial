import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Bus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export function LoginPage() {
  const { user, isPending, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isPending && user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);
    if (signInError) {
      setError(signInError.message || "Invalid email or password.");
      return;
    }
    navigate("/");
  }

  return (
    <div className="flex min-h-svh bg-background">
      {/* Left — form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 md:w-1/2 lg:w-2/5 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
              <Bus className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Namma Transit</p>
              <p className="text-xs text-muted-foreground">Survey Admin</p>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to view commuter survey insights.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="bg-muted/60 border-transparent focus-visible:bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-muted/60 border-transparent focus-visible:bg-background"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              size="lg"
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-violet-600"
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>

      {/* Right — photo */}
      <div className="relative hidden overflow-hidden md:block md:w-1/2 lg:w-3/5">
        <div className="absolute inset-3 overflow-hidden rounded-[2.5rem]">
          <img
            src="/namma-transit.png"
            alt="Commuters boarding a BMTC bus at Majestic, Bengaluru"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* brand tint */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-700/35 via-violet-700/15 to-transparent" />
          {/* legibility scrim for the text */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-12">
            <p className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              8,00,000+ daily commuters
            </p>
            <h2 className="mt-4 max-w-md text-3xl font-semibold leading-tight text-white">
              Understand every first &amp; last mile commute.
            </h2>
            <p className="mt-3 max-w-sm text-sm text-white/70">
              Real-time survey responses from commuters across Bengaluru, in one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
