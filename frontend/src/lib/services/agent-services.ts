import { spawn } from 'child_process';
import path from 'path';

import { AnalysisJob, AnalysisMessage } from '@/types/analysis';

import { updateJob } from '@/lib/data/jobs';
import { logger } from '@/lib/logger';

interface AgentMessage {
  content: string;
  sender: string;
}

/**
 * Service to interact with the AI agents backend
 */
export class AgentService {
  /**
   * Start an analysis with the AI agents
   */
  static async startAnalysis(job: AnalysisJob): Promise<void> {
    try {
      // Update job status to running
      await updateJob(job.job_id, {
        status: 'running',
        progress: 5,
        messages: [
          {
            timestamp: new Date().toISOString(),
            content: 'Starting analysis process',
            sender: 'system',
          },
        ],
      });

      // Launch analysis in a separate process
      this.launchAnalysisProcess(job);

      logger.info('Analysis started', { jobId: job.job_id });
    } catch (error) {
      logger.error('Failed to start analysis', { jobId: job.job_id, error });

      // Update job status to failed
      await updateJob(job.job_id, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        messages: [
          {
            timestamp: new Date().toISOString(),
            content: `Failed to start analysis: ${error instanceof Error ? error.message : String(error)}`,
            sender: 'system',
          },
        ],
      });

      throw error;
    }
  }

  /**
   * Launch the analysis process in a separate thread/process
   */
  private static launchAnalysisProcess(job: AnalysisJob): void {
    // Construct the input for the AI agents
    const filePaths = job.file_paths.join(',');
    const userInput = `datapath:${filePaths}\n${job.messages[0].content}`;

    // Python script path
    const pythonScript =
      process.env.DATAGEN_SCRIPT_PATH || path.join(process.cwd(), '..', 'main.py');
    const workingDir = process.env.DATAGEN_WORKING_DIR || path.join(process.cwd(), '..');

    logger.debug('Launching analysis process', {
      jobId: job.job_id,
      pythonScript,
      workingDir,
    });

    // Spawn the process
    const childProcess = spawn(
      'python',
      [pythonScript, `--job_id=${job.job_id}`, `--input=${userInput}`],
      {
        cwd: workingDir,
        detached: true, // Allow the process to run independently
        stdio: ['ignore', 'pipe', 'pipe'], // Redirect stdout and stderr
      }
    );

    // Handle process output
    childProcess.stdout.on('data', (data) => {
      const output = data.toString();
      logger.debug('Process output', { jobId: job.job_id, output });

      // Parse agent messages and update job if needed
      this.handleAgentOutput(job.job_id, output);
    });

    // Handle errors
    childProcess.stderr.on('data', (data) => {
      const errorMsg = data.toString();
      logger.error('Process error', { jobId: job.job_id, error: errorMsg });

      // Update job with error message
      updateJob(job.job_id, {
        messages: [
          {
            timestamp: new Date().toISOString(),
            content: `Error: ${errorMsg}`,
            sender: 'system',
          },
        ],
      }).catch((err) => {
        logger.error('Failed to update job with error message', {
          jobId: job.job_id,
          error: err,
        });
      });
    });

    // Handle process exit
    childProcess.on('exit', (code) => {
      logger.info('Process completed', { jobId: job.job_id, exitCode: code });

      // If exit code is not 0, consider it a failure
      if (code !== 0) {
        updateJob(job.job_id, {
          status: 'failed',
          error: `Process exited with code ${code}`,
          messages: [
            {
              timestamp: new Date().toISOString(),
              content: `Analysis process failed with exit code ${code}`,
              sender: 'system',
            },
          ],
        }).catch((err) => {
          logger.error('Failed to update job status on process exit', {
            jobId: job.job_id,
            error: err,
          });
        });
      } else {
        // Final update to ensure job is marked as completed
        this.finalizeJob(job.job_id);
      }
    });

    // Unref the child process to allow the Node.js event loop to exit
    if (childProcess.unref) {
      childProcess.unref();
    }
  }

  /**
   * Handle output from the agent process
   */
  private static handleAgentOutput(jobId: string, output: string): void {
    try {
      // Look for agent messages in the output
      // This assumes your agent system outputs in a specific format
      // Adjust the parsing logic based on your actual output format

      // Example: Agent output might be JSON formatted with special markers
      const agentMsgRegex = /\[AGENT_MSG\](.*?)\[\/AGENT_MSG\]/g;
      const progressRegex = /\[PROGRESS\](\d+)\[\/PROGRESS\]/;

      // Extract agent messages
      const agentMessages: AnalysisMessage[] = [];
      let match;
      while ((match = agentMsgRegex.exec(output)) !== null) {
        try {
          const msgData = JSON.parse(match[1]) as AgentMessage;
          agentMessages.push({
            timestamp: new Date().toISOString(),
            content: msgData.content,
            sender: msgData.sender,
          });
        } catch (error) {
          logger.warn('Failed to parse agent message', { jobId, error });
        }
      }

      // Extract progress
      const progressMatch = progressRegex.exec(output);
      const progress = progressMatch ? parseInt(progressMatch[1], 10) : undefined;

      // Update the job if we have messages or progress
      if (agentMessages.length > 0 || progress !== undefined) {
        const update: Record<string, unknown> = {};

        if (agentMessages.length > 0) {
          update.messages = agentMessages;
        }

        if (progress !== undefined) {
          update.progress = progress;
        }

        updateJob(jobId, update).catch((error) => {
          logger.error('Failed to update job with agent output', { jobId, error });
        });
      }
    } catch (error) {
      logger.error('Error processing agent output', { jobId, error });
    }
  }

  /**
   * Finalize a job after processing completes
   */
  private static async finalizeJob(jobId: string): Promise<void> {
    try {
      await updateJob(jobId, {
        status: 'completed',
        progress: 100,
        messages: [
          {
            timestamp: new Date().toISOString(),
            content: 'Analysis completed successfully',
            sender: 'system',
          },
        ],
      });

      logger.info('Job finalized successfully', { jobId });
    } catch (error) {
      logger.error('Failed to finalize job', { jobId, error });
    }
  }
}
