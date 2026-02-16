import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, Form, Input, Label, Spinner } from "@heroui/react";
import { authClient } from "../lib/auth-client";

type Mode = "sign-in" | "sign-up";

export default function LoginRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result =
        mode === "sign-in"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ email, password, name: name.trim() });
      if (result.error) {
        setError(result.error.message ?? "Authentication failed.");
        return;
      }

      const user = result.data?.user;
      if (!user?.name) {
        navigate("/profile?setup=true", { replace: true });
      } else {
        navigate(redirect, { replace: true });
      }
    } catch {
      setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container-shell flex min-h-[60vh] items-center justify-center py-10">
      <Card className="w-full max-w-sm px-6 py-8">
        <Card.Header>
          <Card.Title className="text-center">Welcome to addreams</Card.Title>
          <Card.Description className="text-center">
            {mode === "sign-in"
              ? "Sign in with your email and password."
              : "Create your account with email and password."}
          </Card.Description>
        </Card.Header>

        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-center text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mb-4 grid grid-cols-2 gap-2">
          <Button
            variant={mode === "sign-in" ? "primary" : "outline"}
            onPress={() => {
              setMode("sign-in");
              setError(null);
            }}
          >
            Sign In
          </Button>
          <Button
            variant={mode === "sign-up" ? "primary" : "outline"}
            onPress={() => {
              setMode("sign-up");
              setError(null);
            }}
          >
            Create Account
          </Button>
        </div>

        <Form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "sign-up" && (
            <TextField
              name="name"
              type="text"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              label="Name"
              placeholder="Your name"
              required
              autoFocus
            />
          )}

          <TextField
            name="email"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            label="Email"
            placeholder="you@example.com"
            required
            autoFocus={mode === "sign-in"}
          />

          <TextField
            name="password"
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            label="Password"
            placeholder={mode === "sign-in" ? "Your password" : "At least 8 characters"}
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isPending={loading}
            isDisabled={
              !email.trim() || !password.trim() || (mode === "sign-up" && !name.trim())
            }
          >
            {loading ? (
              <>
                <Spinner color="current" size="sm" />
                Working...
              </>
            ) : mode === "sign-in" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>
        </Form>
      </Card>
    </section>
  );
}

function TextField({
  name,
  type,
  value,
  onChange,
  label,
  placeholder,
  required,
  autoFocus,
}: {
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  placeholder: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      <Label>{label}</Label>
      <Input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
      />
    </div>
  );
}
