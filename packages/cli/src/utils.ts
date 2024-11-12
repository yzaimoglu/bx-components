import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import https from 'https';
import http from 'http';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { Component, Files, File, Config } from './types';
import { standardOutputDirectory } from './const';

export async function downloadFile(url: string, outputPath: string): Promise<void> {
  try {
    // Get API key from config
    const config = await getConfig();

    // Create directories if they don't exist
    await mkdir(dirname(outputPath), { recursive: true });

    return new Promise((resolve, reject) => {
      // Parse URL
      const parsedUrl = new URL(url);

      // Create request options
      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? '443' : '80'),
        path: parsedUrl.pathname + parsedUrl.search,
        protocol: parsedUrl.protocol,
        headers: {
          'bx_auth': config.api_key
        }
      };

      // Choose protocol based on URL
      const protocol = url.startsWith('https') ? https : http;

      protocol.get(requestOptions, (response) => {
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
    const config = await getConfig();
    const response = await fetch(`${baseUrl}/${componentName}`, {
      headers: {
        "BX_AUTH": config.api_key
      }
    });

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

export async function fetchComponents(componentName: string, baseUrl: string = 'http://localhost:1923'): Promise<Component[]> {
  try {
    const config = await getConfig();
    const response = await fetch(`${baseUrl}/${componentName}`, {
      headers: {
        "BX_AUTH": config.api_key
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch components: ${response.statusText}`);
    }

    return response.json() as Promise<Component[]>;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch component "${componentName}": ${error.message}`);
    }
    throw new Error(`Unknown error while fetching component "${componentName}"`);
  }
}


export async function createComponent(componentName: string, framework: keyof Files) {
  try {
    console.log(`Installing ${componentName}...`);
    const component = await fetchComponent(componentName);

    if (component.registryDependencies.length !== 0) {
      console.log(`Installing dependencies...`)
      for (const dependencyName of component.registryDependencies) {
        await createComponent(dependencyName, framework);
      }
      console.log(`Dependencies of ${componentName} installed.`)
    }

    if (!component.files || !(framework in component.files)) {
      console.error(`No ${framework} files found for component ${componentName}`);
    }

    const files: File[] = component.files[framework as keyof Files];
    for (const file of files) {
      try {
        const sourcePath = `http://localhost:1923/${framework}/${file.path}`;
        const destPath = `${standardOutputDirectory}/${file.path}`;

        await downloadFile(sourcePath, destPath);
        console.log(`Downloaded ${file.path}`);
      } catch (error) {
        console.error(`Failed to download ${file.path}:`, error);
        process.exit(1);
      }
    }

    console.log(`Successfully installed ${componentName} for ${framework}`);
  } catch (error) {
    console.error(`Failed to install ${componentName}:`, error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

export async function createConfig(data: Config) {
  const filePath = path.join(os.tmpdir(), "bx-components", "config.json");
  try {
    try {
      await fs.stat(filePath);
      // If file exists, return without creating
      return;
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, proceed with creation
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      console.log(`Config file was created at ${filePath}.`)
      return data;
    }
  } catch (error) {
    console.error('Error creating config file:', error);
    throw error;
  }
}

export async function overwriteConfig(data: Config): Promise<Config> {
  const filePath = path.join(os.tmpdir(), "bx-components", "config.json");
  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Write data to file, overwriting if it exists
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Config file at ${filePath} was overwritten.`)
    return data;
  } catch (error) {
    console.error('Error overwriting config file:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

export async function getConfig(): Promise<Config> {
  const filePath = path.join(os.tmpdir(), "bx-components", "config.json");

  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContent) as Config;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error('Config file does not exist');
    }
    throw error;
  }
}
