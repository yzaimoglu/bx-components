import inquirer from "inquirer";
import { Command } from "commander";
import { downloadFile, fetchComponent } from "../utils";
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
        try {
          console.log(`Installing ${componentName}...`);
          const component = await fetchComponent(componentName);

          if (!component.files || !(framework in component.files)) {
            console.error(`No ${framework} files found for component ${componentName}`);
            continue;
          }

          const files: File[] = component.files[framework as keyof Files];
          for (const file of files) {
            try {
              const sourcePath = `https://raw.githubusercontent.com/yzaimoglu/bx-components/refs/heads/main/packages/${framework}/src/${file.path}`;
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
    } catch (error) {
      console.error('Operation cancelled');
      process.exit(1);
    }
  });
