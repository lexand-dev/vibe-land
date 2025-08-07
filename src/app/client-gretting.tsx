"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { Input } from "@/components/ui/input";

const ClientGreeting = () => {
  const [value, setValue] = useState("");
  const trpc = useTRPC();

  const invoke = useMutation(
    trpc.invoke.mutationOptions({
      onSuccess: () => {
        toast.success("Function invoked successfully!");
      }
    })
  );

  return (
    <div>
      <div>
        <p>Client component</p>
        <Input value={value} onChange={(e) => setValue(e.target.value)} />
        <Button
          onClick={() => invoke.mutate({ value: value })}
          disabled={invoke.isPending}
        >
          Invoke Function
        </Button>
      </div>
    </div>
  );
};

export default ClientGreeting;
