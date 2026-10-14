"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    shortName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/account/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/");
      } else {
        setErrorMessage("Registration failed. Check your code and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    void handleSubmit(event).catch(() => {
      setErrorMessage("Unable to register. Check your connection and try again.");
    });
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

        {errorMessage && <p role="alert">{errorMessage}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Registering…" : "Register"}
        </Button>
      </form>
    </div>
  );
}
