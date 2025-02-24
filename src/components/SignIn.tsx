"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function SignIn() {
  const { data: session } = useSession();

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
  return <Button onClick={() => signIn()}>Get started</Button>;
}
