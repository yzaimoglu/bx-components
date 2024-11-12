import inquirer from "inquirer";
import { Command } from "commander";
import { createComponent, downloadFile, fetchComponent } from "../utils";
import { standardOutputDirectory } from "../const";
import { File, Files } from "../types";

const FRAMEWORKS: FrameworkChoice[] = [
  {
    name: "Vue",
    value: "vue"
  },
  {
    name: "Angular",
    value: "angular"
  }
] as const;


type FrameworkChoice = {
  name: string;
  value: keyof Files;
};

export const add = new Command()
  .name("add")
  .description("add a component to your project")
  .argument("[components...]", "the components to add")
  .option("-y, --yes", "skip confirmation prompt.", true)
  .option("-o, --overwrite", "overwrite existing files.", false)
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option("-a, --all", "add all available components", false)
  .option("-p, --path <path>", "the path to add the component to.")
  .option("-f, --framework <type>", "the framework you are using")
  .action(async (components: string[], opts) => {
    try {
      const framework = opts.framework?.toLowerCase() as keyof Files ||
        (await inquirer.prompt([{
          type: 'list',
          name: 'framework',
          message: 'Which framework are you using?',
          choices: FRAMEWORKS,
          default: 'vue'
        }])).framework as keyof Files;

      for (const componentName of components) {
        createComponent(componentName, framework);
      }
    } catch (error) {
      console.error('Operation cancelled');
      process.exit(1);
    }
  });
