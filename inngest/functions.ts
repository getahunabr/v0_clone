// src/inngest/functions.ts
import { inngest } from "./client";
import { gemini, createAgent } from "@inngest/agent-kit";

export const processTask = inngest.createFunction(
  {
    id: "process-task",
    triggers: { event: "app/task.created" },
  },
  async ({ event, step }) => {
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

    return { message: output[0].content };
  },
);
