"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ClientGreeting = () => {
  const [value, setValue] = useState("");
  const trpc = useTRPC();

  const { data: messages } = useQuery(trpc.messages.getMany.queryOptions());
  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
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
          onClick={() => createMessage.mutate({ value: value })}
          disabled={createMessage.isPending}
        >
          Invoke Function
        </Button>
      </div>
      {JSON.stringify(messages, null, 2)}
    </div>
  );
};

export default ClientGreeting;
