import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import https from 'https';
import http from 'http';
import { Component } from './types';

export async function downloadFile(url: string, outputPath: string): Promise<void> {
  try {
    // Create directories if they don't exist
    await mkdir(dirname(outputPath), { recursive: true });

    return new Promise((resolve, reject) => {
      // Choose protocol based on URL
      const protocol = url.startsWith('https') ? https : http;

      protocol.get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            downloadFile(redirectUrl, outputPath)
              .then(resolve)
              .catch(reject);
            return;
          }
        }

        // Check if the request was successful
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download file: ${response.statusCode} ${response.statusMessage}`));
          return;
        }

        // Create write stream
        const fileStream = createWriteStream(outputPath);

        // Pipe the response to the file
        response.pipe(fileStream);

        // Handle events
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });

        fileStream.on('error', (error) => {
          reject(error);
        });

        response.on('error', (error) => {
          fileStream.close();
          reject(error);
        });

      }).on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    throw new Error(`Failed to download file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function fetchComponent(componentName: string, baseUrl: string = 'http://localhost:1923'): Promise<Component> {
  try {
    const response = await fetch(`${baseUrl}/${componentName}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Component "${componentName}" not found`);
      }
      throw new Error(`Failed to fetch component: ${response.statusText}`);
    }

    const component = await response.json() as Component;
    return component;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch component "${componentName}": ${error.message}`);
    }
    throw new Error(`Unknown error while fetching component "${componentName}"`);
  }
}