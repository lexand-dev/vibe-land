"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

const ClientGreeting = () => {
  const trpc = useTRPC();
  const greeting = useSuspenseQuery(
    trpc.hello.queryOptions({ text: "from tRPC" })
  );

  return (
    <div>
      <div>
        <p>Client component</p>
        {JSON.stringify(greeting.data)}
      </div>
    </div>
  );
};

export default ClientGreeting;
