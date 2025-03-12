import { z } from 'zod';

// Schema for validating analysis request data
export const analysisRequestSchema = z.object({
  job_id: z.string().uuid(),
  instructions: z.string().min(1, 'Instructions cannot be empty'),
  file_paths: z.array(z.string()).min(1, 'At least one file path is required'),
  additional_params: z.record(z.unknown()).optional(),
});

// Schema for job updates
export const jobUpdateSchema = z.object({
  status: z.enum(['queued', 'running', 'completed', 'failed', 'cancelled']).optional(),
  progress: z.number().min(0).max(100).optional(),
  current_agent: z.string().optional(),
  messages: z
    .array(
      z.object({
        timestamp: z.string(),
        content: z.string(),
        sender: z.string(),
      })
    )
    .optional(),
  result: z
    .object({
      summary: z.string().optional(),
      files: z.array(z.string()).optional(),
      completion_time: z.string().optional(),
    })
    .optional(),
  error: z.string().optional(),
  completed_at: z.string().optional(),
});

// Export types for use in other parts of the application
export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
export type JobUpdate = z.infer<typeof jobUpdateSchema>;
