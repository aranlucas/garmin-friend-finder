import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/auth";

export default async function SignIn() {
  const session = await auth();

  if (session) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-4">
          <Link href="/account/register" className={buttonVariants()}>
            Register Device
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Link href="/api/auth/signin" className={buttonVariants()}>
      Get started
    </Link>
  );
}
