import { getQueryClient } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import ClientGreeting from "./client-gretting";
import { Suspense } from "react";

const Home = async () => {
  const queryClient = getQueryClient();
  /*   void queryClient.prefetchQuery(trpc.messages.getMany.queryOptions()); */

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div>Loading...</div>}>
        <ClientGreeting />
      </Suspense>
    </HydrationBoundary>
  );
};

export default Home;
