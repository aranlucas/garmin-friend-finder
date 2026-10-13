"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    code: "",
    shortName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch("/api/account/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      router.push("/");
    }
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    handleSubmit(event).catch((error: unknown) => console.error(error));
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-4 p-8">
        <h1 className="mbe-6 text-2xl font-bold">Register Device</h1>

        <div>
          <label htmlFor="code" className="mbe-2 block text-sm font-medium">
            Code
          </label>
          <Input
            id="code"
            type="text"
            value={formData.code}
            onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
            required
          />
        </div>

        <div>
          <label htmlFor="shortName" className="mbe-2 block text-sm font-medium">
            Short Name
          </label>
          <Input
            id="shortName"
            type="text"
            value={formData.shortName}
            onChange={(e) => setFormData((prev) => ({ ...prev, shortName: e.target.value }))}
            required
          />
        </div>

        <Button type="submit" className="w-full">
          Register
        </Button>
      </form>
    </div>
  );
}
