// src/inngest/functions.ts
import { inngest } from "./client";
import {
  openai,
  createAgent,
  createTool,
  createNetwork,
} from "@inngest/agent-kit";
import { Sandbox } from "e2b";
import z from "zod";
import { PROMPT } from "../modules/prompt";
import { lastAssistantTextMessageContent } from "./utils";

export const codeAgentFunction = inngest.createFunction(
  {
    id: "code-agent",
    triggers: { event: "code-agent/run" },
  },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create(
        "getahuns-project/name-your-template-dev",
        { timeoutMs: 10 * 60 * 1000 },
      );

      // Start the Next.js dev server in the background
      await sandbox.commands.run("npx next dev --turbopack -p 3000", {
        cwd: "/home/user",
        background: true,
        timeoutMs: 10 * 60 * 1000, // 10 minutes — prevents the 60s default kill
      });

      return sandbox.sandboxId;
    });

    const taskName = event.data.taskName ?? "User";

    const codeAgent = createAgent({
      name: "code-Agent",
      description: "An Expert coding Agent.",
      system: PROMPT,
      model: openai({
        model: "openai/gpt-oss-120b",
        apiKey: process.env.GROQ_API_KEY,
        baseUrl: "https://api.groq.com/openai/v1",
      }),
      tools: [
        // 1,Terminal
        createTool({
          name: "Terminal",
          description: "use the terminal to run commands.",
          parameters: z.object({
            command: z.string().describe("The command to run in the terminal."),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };
              try {
                const sandbox = await Sandbox.connect(sandboxId);
                const result = await sandbox.commands.run(command, {
                  cwd: "/home/user",
                  onStdout: (data) => {
                    buffers.stdout += data.toString();
                  },
                  onStderr: (data) => {
                    buffers.stderr += data.toString();
                  },
                });

                return result.stdout;
              } catch (error) {
                console.error("Error running command:", error);
                return buffers.stderr || "Error running command.";
              }
            });
          },
        }),
        // 2,createOrUpdate
        createTool({
          name: "createOrUpdate",
          description:
            "Create or update a file in the sandbox. Use this to create or update files.",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z
                  .string()
                  .describe("The path of the file to create or update."),
                content: z
                  .string()
                  .describe("The content of the file to create or update."),
              }),
            ),
          }),
          handler: async ({ files }, { step, network }) => {
            const newFiles = await step?.run("createOrUpdate", async () => {
              try {
                const updatedFiles = network?.state?.data.files || [];
                const sandbox = await Sandbox.connect(sandboxId);

                for (const file of files) {
                  const { path, content } = file;
                  await sandbox.files.write(path, content);
                  updatedFiles.push({ path, content });
                }

                return updatedFiles;
              } catch (error) {
                console.error("Error creating or updating files:", error);
                return "Error creating or updating files.";
              }
            });

            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }

            return newFiles;
          },
        }),

        // 3,readFile
        createTool({
          name: "readFile",
          description: "Read a file from the sandbox.",
          parameters: z.object({
            files: z
              .array(z.string())
              .describe("The path of the file to read."),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFile", async () => {
              try {
                const sandbox = await Sandbox.connect(sandboxId);
                const contents = [];

                for (const filePath of files) {
                  const content = await sandbox.files.read(filePath);
                  contents.push({ path: filePath, content });
                }

                return JSON.stringify(contents);
              } catch (error) {
                console.error("Error reading file:", error);
                return "Error reading file.";
              }
            });
          },
        }),
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
        },
      },
    });

    const network = createNetwork({
      name: "code-agent-network",
      agents: [codeAgent],
      maxIter: 5,
      router: async ({ network }) => {
        const summary = network?.state?.data.summary;
        if (summary) return;

        return codeAgent;
      },

      description:
        "A network for the code agent to communicate with the sandbox.",
    });

    const result = await network.run(event.data.value);
    const isError =
      !result?.state.data.summary ||
      Object.keys(result?.state.data.summary || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await Sandbox.connect(sandboxId);
      const host = sandbox.getHost(3000);
      return `http://${host}`;
    });

    return {
      url: sandboxUrl,
      title: "untitled",
      files: result.state.data.files,
      summary: result.state.data.summary,
      isError,
    };
  },
);
