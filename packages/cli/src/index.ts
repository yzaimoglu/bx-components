#!/usr/bin/env node
import { add } from "@/src/commands/add"
import { config } from "@/src/commands/config"
import { Command } from "commander"
import { createConfig } from "./utils"

process.on("SIGINT", () => process.exit(0))
process.on("SIGTERM", () => process.exit(0))

async function main() {
  // create config if not already created
  await createConfig({
    api_key: "undefined"
  });

  const program = new Command()
    .name("bx-components")
    .description("add components to your project")
    .version(
      "1.0.0",
      "-v, --version",
      "display the version number"
    )

  program.addCommand(add).addCommand(config)

  program.parse()
}

main()
