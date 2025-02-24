import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";

export default async function SignIn() {
  const session = await auth();

  if (session) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/account/register">Register Device</Link>
          </Button>
        </div>
      </div>
    );
  }
  return (
    <Button asChild>
      <Link href="/api/auth/signin">Get started</Link>
    </Button>
  );
}
