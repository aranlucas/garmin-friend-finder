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

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-6">Register Device</h1>

        <div>
          <label className="block text-sm font-medium mb-2">Code</label>
          <Input
            type="text"
            value={formData.code}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, code: e.target.value }))
            }
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Short Name</label>
          <Input
            type="text"
            value={formData.shortName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, shortName: e.target.value }))
            }
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
