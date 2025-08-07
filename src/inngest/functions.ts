import { inngest } from "./client";
import { openai, createAgent } from "@inngest/agent-kit";

const model = openai({ model: "gpt-4.1" });

/* const deepSeek = deepseek({
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY
}); */

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event }) => {
    const codeAgent = createAgent({
      name: "code-agent",
      system:
        "You are an expert next.js developer, You wirte readeable and maintanable code. You write simple Next.js code snippets. Like button components, API routes, or pages.",
      model
    });

    const { output } = await codeAgent.run(`Write the following snippet 
      ${event.data.value}`);

    return { message: output };
  }
);
