import { emitJobUpdate } from '@/app/api/socket/route';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { AnalysisJob } from '@/types/analysis';

import { logger } from '../logger';
import { AnalysisRequest, JobUpdate } from '../validations/analysis';

// Directory for storing job data
const JOBS_DIR = process.env.JOBS_DIR || path.join(os.tmpdir(), 'datagen-jobs');

/**
 * Initialize jobs directory
 */
async function initializeJobsDir() {
  try {
    await fs.mkdir(JOBS_DIR, { recursive: true });
  } catch (error) {
    logger.error('Failed to create jobs directory', { error });
    throw new Error('Failed to initialize jobs storage');
  }
}

/**
 * Create a new analysis job
 */
export async function createJob(request: AnalysisRequest): Promise<AnalysisJob> {
  await initializeJobsDir();

  const jobPath = path.join(JOBS_DIR, `${request.job_id}.json`);

  // Create the job object
  const job: AnalysisJob = {
    job_id: request.job_id,
    status: 'queued',
    progress: 0,
    started_at: new Date().toISOString(),
    messages: [
      {
        timestamp: new Date().toISOString(),
        content: request.instructions,
        sender: 'human',
      },
    ],
    file_paths: request.file_paths,
  };

  // Save the job
  try {
    await fs.writeFile(jobPath, JSON.stringify(job, null, 2), 'utf-8');
    logger.info('Created new job', { jobId: request.job_id });
    return job;
  } catch (error) {
    logger.error('Failed to save job', { jobId: request.job_id, error });
    throw new Error('Failed to create job');
  }
}

/**
 * Get a job by ID
 */
export async function getJobById(jobId: string): Promise<AnalysisJob | null> {
  const jobPath = path.join(JOBS_DIR, `${jobId}.json`);

  try {
    const jobData = await fs.readFile(jobPath, 'utf-8');
    return JSON.parse(jobData) as AnalysisJob;
  } catch (error) {
    // If file doesn't exist, return null
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }

    logger.error('Error reading job data', { jobId, error });
    throw new Error(`Failed to read job data: ${jobId}`);
  }
}

/**
 * Update a job with new data
 */
export async function updateJob(jobId: string, update: JobUpdate): Promise<AnalysisJob> {
  const job = await getJobById(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  // Update job fields
  const updatedJob: AnalysisJob = {
    ...job,
    ...update,
    // For arrays, we want to append, not replace
    messages: update.messages ? [...(job.messages || []), ...update.messages] : job.messages,
  };

  // If status is changing to completed or failed, add completed_at
  if (
    update.status &&
    ['completed', 'failed', 'cancelled'].includes(update.status) &&
    !updatedJob.completed_at
  ) {
    updatedJob.completed_at = new Date().toISOString();
  }

  // Save updated job
  const jobPath = path.join(JOBS_DIR, `${jobId}.json`);
  await fs.writeFile(jobPath, JSON.stringify(updatedJob, null, 2), 'utf-8');

  // Emit real-time update
  emitJobUpdate(jobId, updatedJob);

  logger.info('Updated job', { jobId, status: updatedJob.status });
  return updatedJob;
}

/**
 * Get all jobs, with optional filtering
 */
export async function getJobs(
  limit: number = 10,
  offset: number = 0,
  status?: string
): Promise<AnalysisJob[]> {
  await initializeJobsDir();

  try {
    // Get all job files
    const files = await fs.readdir(JOBS_DIR);
    const jobFiles = files.filter((file) => file.endsWith('.json'));

    // Read each job file
    const jobs: AnalysisJob[] = [];

    for (const file of jobFiles) {
      try {
        const jobPath = path.join(JOBS_DIR, file);
        const jobData = await fs.readFile(jobPath, 'utf-8');
        const job = JSON.parse(jobData) as AnalysisJob;

        // Apply status filter if provided
        if (status && job.status !== status) {
          continue;
        }

        jobs.push(job);
      } catch (error) {
        logger.error('Error reading job file', { file, error });
      }
    }

    // Sort by start date (newest first) and apply pagination
    return jobs
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
      .slice(offset, offset + limit);
  } catch (error) {
    logger.error('Error listing jobs', { error });
    throw new Error('Failed to list jobs');
  }
}

/**
 * Delete a job (soft delete)
 */
export async function deleteJob(jobId: string): Promise<void> {
  // We're implementing a soft delete by marking the job as deleted
  return updateJob(jobId, { deleted: true } as JobUpdate);
}
