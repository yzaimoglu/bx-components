#!/usr/bin/env node
import { add } from "@/src/commands/add"
import { Command } from "commander"

process.on("SIGINT", () => process.exit(0))
process.on("SIGTERM", () => process.exit(0))

async function main() {
  const program = new Command()
    .name("bx-components")
    .description("add components to your project")
    .version(
      "1.0.0",
      "-v, --version",
      "display the version number"
    )

  program.addCommand(add)

  program.parse()
}

main()
