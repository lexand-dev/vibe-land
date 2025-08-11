"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const ClientGreeting = () => {
  const router = useRouter();
  const [value, setValue] = useState("");
  const trpc = useTRPC();

  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: (data) => {
        toast.success("Project created successfully");
        router.push(`/projects/${data.id}`);
      }
    })
  );

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="max-w-7xl mx-auto flex items-center flex-col gap-y-4 justify-center">
        <p>Create App</p>
        <Input value={value} onChange={(e) => setValue(e.target.value)} />
        <Button
          onClick={() => createProject.mutate({ value: value })}
          disabled={createProject.isPending}
        >
          submit
        </Button>
      </div>
    </div>
  );
};

export default ClientGreeting;
