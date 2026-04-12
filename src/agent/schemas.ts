import { z } from "zod";

export const SubTaskSchema = z.object({
  agent_name: z.enum(["flight_agent", "policy_agent", "booking_agent"]),
  description: z.string().describe("What needs to be done"),
  priority: z.number().min(1).max(3).describe("1=highest, 3=lowest"),
});

export const CoordinatorPlanSchema = z.object({
  reasoning: z.string().describe("Why this decomposition was chosen"),
  subtasks: z.array(SubTaskSchema).describe("List of subtasks in execution order"),
});

export const AgentResultSchema = z.object({
  agent_name: z.string(),
  status: z.enum(["success", "error", "partial"]),
  result: z.string(),
  tools_used: z.array(z.string()).default([]),
});

export const CriticFeedbackSchema = z.object({
  approved: z.boolean().describe("Whether the answer is approved"),
  score: z.number().min(0).max(10).describe("Score 0-10"),
  issues: z.array(z.string()).default([]).describe("Issues found"),
  suggestions: z.array(z.string()).default([]).describe("Suggestions"),
  reasoning: z.string().describe("Reasoning behind the score"),
});

export type SubTask = z.infer<typeof SubTaskSchema>;
export type CoordinatorPlan = z.infer<typeof CoordinatorPlanSchema>;
export type AgentResult = z.infer<typeof AgentResultSchema>;
export type CriticFeedback = z.infer<typeof CriticFeedbackSchema>;
