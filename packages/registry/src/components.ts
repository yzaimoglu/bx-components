import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { Component } from './types';

async function readComponentFiles(directoryPath: string): Promise<Component[]> {
  try {
    // Read all files in the directory
    const files = await readdir(directoryPath);
    
    // Filter for .json files and read them
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    // Read and parse each JSON file
    const components = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = join(directoryPath, file);
        try {
          const content = await readFile(filePath, 'utf-8');
          const component = JSON.parse(content) as Component;
          return component;
        } catch (error) {
          console.error(`Error reading component file ${file}:`, error);
          return null;
        }
      })
    );

    // Filter out any null values from failed reads
    return components.filter((component): component is Component => component !== null);
  } catch (error) {
    console.error('Error reading components directory:', error);
    throw error;
  }
}

export const getComponents = async (): Promise<Component[]> => {
  return readComponentFiles("components");
};

export const getSingleComponent = (components: Component[], name: string): Component | undefined => {
  return components.find((c) => c.name === name);
};
