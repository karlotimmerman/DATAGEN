import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { logger } from './logger';

// Base directory for storing uploaded files
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(os.tmpdir(), 'datagen-uploads');

/**
 * Process and save uploaded files for analysis
 *
 * @param files Array of File objects from form data
 * @param jobId Unique job identifier
 * @returns Array of saved file paths
 */
export async function processFiles(files: File[], jobId: string): Promise<string[]> {
  // Create job directory
  const jobDir = path.join(UPLOADS_DIR, jobId);
  await fs.mkdir(jobDir, { recursive: true });

  logger.info(`Created directory for job ${jobId}`, { path: jobDir });

  // Process each file
  const savedPaths: string[] = [];

  for (const file of files) {
    try {
      // Generate safe filename
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, '_');

      // Ensure unique filename by adding timestamp if needed
      const fileName = safeName;
      const filePath = path.join(jobDir, fileName);

      // Read file contents
      const buffer = Buffer.from(await file.arrayBuffer());

      // Save file
      await fs.writeFile(filePath, buffer);

      // Add to list of saved files
      savedPaths.push(filePath);

      logger.debug(`Saved file for job ${jobId}`, {
        originalName: file.name,
        savedAs: fileName,
        size: buffer.length,
      });
    } catch (error) {
      logger.error(`Error saving file for job ${jobId}`, {
        fileName: file.name,
        error,
      });
      throw new Error(`Failed to process file: ${file.name}`);
    }
  }

  return savedPaths;
}

interface FileContent {
  content: string;
}

interface FileMetadata {
  path: string;
  size: number;
  type: string;
}

type ParsedFileResult =
  | Record<string, string>[]
  | Record<string, unknown>
  | FileContent
  | FileMetadata;

/**
 * Get file type and process it accordingly
 * For example, parse CSV files into JSON format
 */
export async function parseFile(filePath: string): Promise<ParsedFileResult> {
  const extension = path.extname(filePath).toLowerCase();

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');

    switch (extension) {
      case '.csv':
        return parseCSV(fileContent);
      case '.json':
        return JSON.parse(fileContent);
      case '.txt':
      case '.md':
        return { content: fileContent };
      default:
        // For other file types, just return basic metadata
        return {
          path: filePath,
          size: (await fs.stat(filePath)).size,
          type: extension,
        };
    }
  } catch (error) {
    logger.error('Error parsing file', { filePath, error });
    throw new Error(`Failed to parse file: ${filePath}`);
  }
}

/**
 * Parse CSV content to JSON
 */
function parseCSV(content: string): Record<string, string>[] {
  // Basic CSV parser - in production, use a robust CSV library
  const lines = content.split('\n');
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = lines[i].split(',').map((v) => v.trim());
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    rows.push(row);
  }

  return rows;
}
