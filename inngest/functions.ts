// src/inngest/functions.ts
import { inngest } from "./client";
import { gemini, createAgent } from "@inngest/agent-kit";
import { Sandbox } from "e2b";

export const processTask = inngest.createFunction(
  {
    id: "process-task",
    triggers: { event: "app/task.created" },
  },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create(
        "getahuns-project/name-your-template-dev",
        { timeoutMs: 10 * 60 * 1000 }
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

    const helloAgent = createAgent({
      name: "hello-Agent",
      description: "A Simple Agent that Says Hello.",
      system: "You are a Helpful Assistant. Always greet with Enthusiasm.",
      model: gemini({
        model: "gemini-3.6-flash",
      }),
    });

    const { output } = await helloAgent.run(`Say Hello to ${taskName}.`);

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await Sandbox.connect(sandboxId);
      const host = sandbox.getHost(3000);
      return `http://${host}`;
    });

    return { message: output[0].content, sandboxUrl };
  },
);
