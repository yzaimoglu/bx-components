import { Command } from "commander";
import prompts from "prompts";
import { overwriteConfig } from "../utils";

export const config = new Command()
  .name("config")
  .description("configure the cli")
  .action(async () => {
    try {
      const response = await prompts({
        type: 'password',
        name: 'api_key',
        message: 'Enter your API key:',
        validate: value => value.length > 0 ? true : 'API key is required'
      });

      // User cancelled the prompt
      if (!response.api_key) {
        console.log('Configuration cancelled');
        return;
      }

      // Create config with the provided API key
      await overwriteConfig({ api_key: response.api_key });
      console.log('Configuration saved successfully');
      
    } catch (error) {
      console.error('Failed to configure:', error);
      process.exit(1);
    }
  });
