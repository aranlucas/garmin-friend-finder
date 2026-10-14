"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { navigationMenuTriggerStyle } from "./ui/navigation-menu-trigger-style";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { ModeToggle } from "./mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { buttonVariants } from "./ui/button-variants";
import { User } from "lucide-react";
import { useState } from "react";

export function MainNav() {
  const { data: session, status } = useSession();
  const [signOutFailed, setSignOutFailed] = useState(false);

  return (
    <div className="relative mbs-2 flex w-full items-center justify-between">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink render={<Link href="/" />} className={navigationMenuTriggerStyle()}>
              Home
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              render={<Link href="/dashboard" />}
              className={navigationMenuTriggerStyle()}
            >
              Dashboard
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <div className="flex items-center gap-2">
        <ModeToggle />
        {status === "authenticated" ? (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
              <User />
              <span className="sr-only">User menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm leading-none font-medium">{session.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user?.email}
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSignOutFailed(false);
                    void signOut().catch(() => setSignOutFailed(true));
                  }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/api/auth/signin"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <User />
            <span className="sr-only">Sign in</span>
          </Link>
        )}
      </div>
      {signOutFailed && (
        <p
          role="alert"
          className="absolute inset-x-0 inset-bs-full z-50 rounded-md border bg-background p-2 text-sm text-destructive shadow-sm"
        >
          Unable to sign out. Please try again.
        </p>
      )}
    </div>
  );
}
