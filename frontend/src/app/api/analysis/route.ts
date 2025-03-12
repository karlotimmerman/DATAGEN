import { NextRequest, NextResponse } from 'next/server';

import { getJobById, updateJob } from '@/lib/data/jobs';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/analysis/[id]
 * Returns the details of a specific analysis job
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const jobId = params.id;

    // Get job details
    const job = await getJobById(jobId);

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: job,
    });
  } catch (error) {
    logger.error('Error fetching job details', { jobId: params.id, error });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job details' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/analysis/[id]
 * Updates the status of an analysis job (used internally by agent system)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const jobId = params.id;
    const data = await request.json();

    // Verify that the job exists
    const existingJob = await getJobById(jobId);
    if (!existingJob) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // Update job with new data
    const updatedJob = await updateJob(jobId, data);

    return NextResponse.json({
      success: true,
      data: updatedJob,
    });
  } catch (error) {
    logger.error('Error updating job', { jobId: params.id, error });
    return NextResponse.json({ success: false, error: 'Failed to update job' }, { status: 500 });
  }
}

/**
 * DELETE /api/analysis/[id]
 * Cancels or deletes an analysis job
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const jobId = params.id;

    // Verify that the job exists
    const existingJob = await getJobById(jobId);
    if (!existingJob) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // If job is running, cancel it
    if (existingJob.status === 'running') {
      await updateJob(jobId, { status: 'cancelled' });
      // Here you would also signal the agent system to stop processing
    }

    // Soft delete the job
    await updateJob(jobId, { deleted: true });

    return NextResponse.json({
      success: true,
      data: { message: 'Job cancelled successfully' },
    });
  } catch (error) {
    logger.error('Error cancelling job', { jobId: params.id, error });
    return NextResponse.json({ success: false, error: 'Failed to cancel job' }, { status: 500 });
  }
}
