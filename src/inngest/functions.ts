import z from "zod";
import { Sandbox } from "@e2b/code-interpreter";
import {
  openai,
  createAgent,
  createTool,
  createNetwork,
  type Tool
} from "@inngest/agent-kit";

import { PROMPT } from "@/prompt";
import { prisma } from "@/lib/db";
import { inngest } from "./client";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";

interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

const model = openai({
  model: "gpt-4.1",
  defaultParameters: { temperature: 0.1 }
});

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    // Sandbox
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("vibe-land-nextjs");
      return sandbox.sandboxId;
    });

    // Agent
    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      description:
        "An expert coding agent that can write code and run it in a sandbox.",
      system: PROMPT,
      model,
      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            command: z.string()
          }),
          handler: async ({ command }, { step }) => {
            // run commands in the sandbox.
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data) => {
                    buffers.stderr += data;
                  }
                });
                return result.stdout;
              } catch (error) {
                // with that errors, the agent knows how can retry the command.
                console.error(`
                  Command failed: ${error}
                  stdout: ${buffers.stdout}
                  stderr: ${buffers.stderr}
                  `);
                return `
                  Command failed: ${error}
                  stdout: ${buffers.stdout}
                  stderr: ${buffers.stderr}
                  `;
              }
            });
          }
        }),
        createTool({
          name: "createOrUpdateFile",
          description: "Create or update a file in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string()
              })
            )
          }),
          handler: async (
            { files },
            { step, network }: Tool.Options<AgentState>
          ) => {
            const newFiles = await step?.run(
              "createOrUpdateFiles",
              async () => {
                try {
                  const updatedFiles = network.state.data.files || {};
                  const sandbox = await getSandbox(sandboxId);
                  for (const file of files) {
                    await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }

                  return updatedFiles;
                } catch (e) {
                  return "Error: " + e;
                }
              }
            );

            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          }
        }),
        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string())
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (error) {
                return "Error reading files: " + error;
              }
            });
          }
        })
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result);

          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }

          return result;
        }
      }
    });

    const network = createNetwork({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 12,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        // Otherwise, run code-agent again.
        return codeAgent;
      }
    });
    const result = await network.run(event.data.value);

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            content: "Something went wrong, please try again.",
            role: "ASSISTANT",
            type: "ERROR"
          }
        });
      }

      return await prisma.message.create({
        data: {
          content: result.state.data.summary,
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: "Fragment",
              files: result.state.data.files
            }
          }
        }
      });
    });

    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary
    };
  }
);
