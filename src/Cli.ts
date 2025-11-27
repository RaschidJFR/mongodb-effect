import * as Command from "@effect/cli/Command"
import * as Args from "@effect/cli/Args"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { DatabaseService, DatabaseLive } from "./mongodb.js"

const stringArg = Args.text({ name: "value" })

const command = Command.make("save", { value: stringArg }).pipe(
  Command.withHandler(({ value }) =>
    Effect.gen(function*() {
      const db = yield* DatabaseService

      // Connect to database
      yield* db.connect()

      // Find the last saved string
      const lastEntry = yield* db.findOne({ type: "saved-string" })
      const lastString = lastEntry && typeof lastEntry === "object" && "value" in lastEntry
        ? String(lastEntry.value)
        : "none"

      // Inform user about the last string
      yield* Console.log(`Last saved string: ${lastString}`)

      // Save the new string
      yield* db.insertOne({ type: "saved-string", value, timestamp: new Date() })

      // Confirm the save
      yield* Console.log(`String "${value}" has been saved to the database`)

      // Close the connection
      yield* db.close()
    }).pipe(Effect.provide(DatabaseLive))
  )
)

export const run = Command.run(command, {
  name: "String Saver",
  version: "0.0.0"
})
