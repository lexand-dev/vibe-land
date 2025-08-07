"use client";

import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";

const ClientGreeting = () => {
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
        <Button onClick={() => invoke.mutate({ text: "HELLOWs" })}>
          Invoke Function
        </Button>
      </div>
    </div>
  );
};

export default ClientGreeting;
