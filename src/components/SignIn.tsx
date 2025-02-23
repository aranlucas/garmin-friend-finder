import { auth } from "@/auth";
import Link from "next/link";

export default async function SignIn() {
  const session = await auth();

  if (session) {
    return (
      <div className="space-y-2">
        <div>Signed in as {session.user?.name}</div>
        <Link
          href="/account/register"
          className="text-blue-500 hover:underline"
        >
          Register Device
        </Link>
      </div>
    );
  }

  return (
    <Link
      href="/api/auth/signin"
      className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      Sign in
    </Link>
  );
}
