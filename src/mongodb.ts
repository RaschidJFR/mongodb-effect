import { Context, Data, Effect, Layer } from "effect"
import { MongoClient } from "mongodb"

class MongoDBError extends Data.TaggedError("MongoDBError") {}

class MongoDBConfig extends Context.Tag("MongoDBConfig")<
  MongoDBConfig,
  {
    uri: string
    db: string
    collection: string
  }
>() {}

const MongoDBConfigLive = Layer.succeed(MongoDBConfig, {
  uri: "mongodb://localhost:27017",
  db: "mydatabase",
  collection: "mycollection"
})

class MongoDBClient extends Context.Tag("MongoDB")<
  MongoDBClient,
  { client: MongoClient }
>() {}

const MongoDBClientLive = Layer.effect(
  MongoDBClient,
  Effect.gen(function*() {
    const { uri } = yield* MongoDBConfig
    const client = new MongoClient(uri)
    return { client }
  })
)

class DatabaseService extends Context.Tag("Database")<
  DatabaseService,
  {
    readonly connect: () => Effect.Effect<void, MongoDBError, MongoDBClient>
    readonly insertOne: <T = unknown>(data: T) => Effect.Effect<void, MongoDBError, MongoDBConfig | MongoDBClient>
    readonly findOne: (filter: unknown) => Effect.Effect<unknown | null, MongoDBError, MongoDBConfig | MongoDBClient>
    readonly close: () => Effect.Effect<void, MongoDBError, MongoDBClient>
  }
>() {}

const connect = () =>
  Effect.gen(function*() {
    const { client } = yield* MongoDBClient
    yield* Effect.tryPromise({
      try: () => client.connect(),
      catch: () => new MongoDBError()
    })
  })

const insertOne = (data: any) =>
  Effect.gen(function*() {
    const { client } = yield* MongoDBClient
    const { collection, db } = yield* MongoDBConfig
    yield* Effect.tryPromise({
      try: () => {
        const database = client.db(db)
        const coll = database.collection(collection)
        return coll.insertOne(data)
      },
      catch: () => new MongoDBError()
    })
  })

const findOne = (filter: any) =>
  Effect.gen(function*() {
    const { client } = yield* MongoDBClient
    const { collection, db } = yield* MongoDBConfig
    const result = yield* Effect.tryPromise({
      try: () => {
        const database = client.db(db)
        const coll = database.collection(collection)
        return coll.findOne(filter)
      },
      catch: () => new MongoDBError()
    })
    return result
  })

const close = () =>
  Effect.gen(function*() {
    const { client } = yield* MongoDBClient
    yield* Effect.tryPromise({
      try: () => client.close(),
      catch: () => new MongoDBError()
    })
  })

const DatabaseServiceLive = Layer.effect(
  DatabaseService,
  Effect.succeed({
    connect,
    insertOne,
    findOne,
    close
  })
)

const MongoDBLive = Layer.merge(MongoDBConfigLive, MongoDBClientLive)

export const DatabaseLive = DatabaseServiceLive.pipe(
  Layer.provide(MongoDBLive),
  Layer.provide(MongoDBConfigLive)
)
