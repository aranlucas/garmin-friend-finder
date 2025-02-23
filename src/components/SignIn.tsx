import { auth } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SignIn() {
  const session = await auth();

  if (session) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="text-muted-foreground">Signed in as {session.user?.name}</div>
        <div className="flex gap-4">
          <Button asChild>
            <Link
              href="/dashboard"
            >
              View Map
            </Link>
          </Button>
          <Button asChild>
            <Link
              href="/account/register"
              className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              Register Device
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/api/auth/signin"
      className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      Get Started
    </Link>
  );
}
