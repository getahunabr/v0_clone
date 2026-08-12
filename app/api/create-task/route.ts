// src/app/api/create-task/route.ts
import { NextResponse } from "next/server";
import { inngest } from "../../../inngest/client";

export async function POST() {
  await inngest.send({
    name: "app/task.created",
    data: { id: "task_001" },
  });

  return NextResponse.json({ message: "Event sent" });
}
