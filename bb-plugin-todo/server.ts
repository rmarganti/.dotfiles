// bb-plugin-todo — a BB plugin backend entry.
//
// The default export is a factory that receives the plugin API. BB supplies
// the tiny defineRpcContract runtime helper; the API type remains type-only.
//
// The example is a todo list. One store in bb.storage.kv serves three
// surfaces: the Example todos page (app.tsx, over RPC), the `bb todo` CLI
// command (below), and the skill in skills/example-todos/SKILL.md that tells
// agents how to use that command. A write from any surface publishes a realtime signal so
// every open page refetches.
import { randomUUID } from "node:crypto";
import { defineRpcContract, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";

const todoSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(["work", "personal"]),
  dueDate: z.string().nullable(),
  done: z.boolean(),
  createdAt: z.string(),
});
export type Todo = z.infer<typeof todoSchema>;

// Both schemas run at the wire boundary. Handler input/output are inferred
// from the shared contract; app.tsx imports only its type.
export const rpcContract = defineRpcContract({
  todos_list: {
    input: z.null(),
    output: z.object({ todos: z.array(todoSchema) }),
  },
  todos_add: {
    input: z.object({ title: z.string().trim().min(1).max(200), category: z.enum(["work", "personal"]), dueDate: z.string().nullable() }),
    output: todoSchema,
  },
  todos_update: {
    input: z.object({ id: z.string(), title: z.string().trim().min(1).max(200).optional(), category: z.enum(["work", "personal"]).optional(), dueDate: z.string().nullable().optional() }),
    output: todoSchema,
  },
  todos_set_done: {
    input: z.object({ id: z.string(), done: z.boolean() }),
    output: todoSchema,
  },
  todos_remove: {
    input: z.object({ id: z.string() }),
    output: z.object({ removed: z.boolean() }),
  },
});

/** Realtime channel app.tsx listens on; the payload is the todo count. */
const TODOS_CHANGED = "todos-changed";

export default async function plugin(bb: BbPluginApi) {
  bb.log.info("loaded");

  // Declarative settings — rendered in BB's settings UI and editable with
  // `bb plugin config todo`. Add `secret: true` for values like API keys.
  // Settings are read once per load: reload the plugin after changing one.
  const settings = bb.settings.define({
    showDone: {
      type: "boolean",
      label: "Show completed todos",
      default: true,
    },
  });
  const { showDone } = await settings.get();

  // Namespaced key-value storage in bb.db (JSON values, up to 256KB each).
  // For bigger or relational data use bb.storage.database().
  async function readTodos(): Promise<Todo[]> {
    const stored = (await bb.storage.kv.get<Array<Partial<Todo> & Pick<Todo, "id" | "title" | "done" | "createdAt">>>("todos")) ?? [];
    return stored.map((todo) => ({ ...todo, category: todo.category ?? "work", dueDate: todo.dueDate ?? null }));
  }
  async function writeTodos(todos: Todo[]): Promise<void> {
    await bb.storage.kv.set("todos", todos);
    // Ephemeral broadcast to every connected client; nothing is persisted.
    bb.realtime.publish(TODOS_CHANGED, { count: todos.length });
  }

  async function listTodos(): Promise<Todo[]> {
    const todos = await readTodos();
    return showDone ? todos : todos.filter((todo) => !todo.done);
  }
  async function addTodo(title: string, category: Todo["category"] = "work", dueDate: string | null = null): Promise<Todo> {
    const todo: Todo = {
      id: randomUUID().slice(0, 8),
      title,
      category,
      dueDate,
      done: false,
      createdAt: new Date().toISOString(),
    };
    await writeTodos([...(await readTodos()), todo]);
    return todo;
  }
  async function updateTodo(id: string, changes: Partial<Pick<Todo, "title" | "category" | "dueDate">>): Promise<Todo | null> {
    const todos = await readTodos();
    const todo = todos.find((candidate) => candidate.id === id);
    if (todo === undefined) return null;
    Object.assign(todo, changes);
    await writeTodos(todos);
    return todo;
  }
  async function setTodoDone(id: string, done: boolean): Promise<Todo | null> {
    const todos = await readTodos();
    const todo = todos.find((candidate) => candidate.id === id);
    if (todo === undefined) return null;
    todo.done = done;
    await writeTodos(todos);
    return todo;
  }
  async function removeTodo(id: string): Promise<boolean> {
    const todos = await readTodos();
    const remaining = todos.filter((todo) => todo.id !== id);
    if (remaining.length === todos.length) return false;
    await writeTodos(remaining);
    return true;
  }

  bb.rpc.register(rpcContract, {
    todos_list: async () => ({ todos: await listTodos() }),
    todos_add: ({ title, category, dueDate }) => addTodo(title, category, dueDate),
    todos_update: async ({ id, ...changes }) => {
      const todo = await updateTodo(id, changes);
      if (todo === null) throw new Error(`No todo with id ${id}`);
      return todo;
    },
    todos_set_done: async ({ id, done }) => {
      const todo = await setTodoDone(id, done);
      if (todo === null) throw new Error(`No todo with id ${id}`);
      return todo;
    },
    todos_remove: async ({ id }) => ({ removed: await removeTodo(id) }),
  });

  // The `bb todo` command: what agents (and you) use from a shell. Parsing
  // argv is plugin-owned; `commands` is metadata BB renders into help and
  // the generated plugin-commands skill without running plugin code.
  const usage = [
    "Usage:",
    "  bb todo list [--json]",
    "  bb todo add <title> [--json]",
    "  bb todo done <todo-id> [--json]",
    "  bb todo undo <todo-id> [--json]",
    "  bb todo remove <todo-id> [--json]",
  ].join("\n");
  function formatTodo(todo: Todo): string {
    const due = todo.dueDate === null ? "" : ` · due ${todo.dueDate}`;
    return `[${todo.done ? "x" : " "}] ${todo.id}  ${todo.title} (${todo.category}${due})`;
  }
  bb.cli.register({
    name: "todo",
    summary: "Manage the Todo plugin's task list",
    commands: [
      { name: "list", summary: "List todos", usage: "bb todo list [--json]" },
      {
        name: "add",
        summary: "Add a todo",
        usage: "bb todo add <title> [--json]",
      },
      {
        name: "done",
        summary: "Mark a todo done",
        usage: "bb todo done <todo-id> [--json]",
      },
      {
        name: "undo",
        summary: "Mark a todo not done",
        usage: "bb todo undo <todo-id> [--json]",
      },
      {
        name: "remove",
        summary: "Remove a todo",
        usage: "bb todo remove <todo-id> [--json]",
      },
    ],
    async run(argv) {
      const json = argv.includes("--json");
      const [command, ...args] = argv.filter((arg) => arg !== "--json");
      const reply = (value: unknown, text: string) => ({
        exitCode: 0,
        stdout: json ? JSON.stringify(value) : text,
      });
      const notFound = (missingId: string) => ({
        exitCode: 1,
        stderr: `No todo with id ${missingId}. Run "bb todo list" to see ids.`,
      });
      const todoId = args[0];
      switch (command) {
        case undefined:
        case "help":
        case "--help":
          return { exitCode: 0, stdout: usage };
        case "list": {
          const todos = await listTodos();
          return reply(
            todos,
            todos.length === 0 ? "No todos." : todos.map(formatTodo).join("\n"),
          );
        }
        case "add": {
          const title = args.join(" ").trim();
          if (title === "") break;
          const todo = await addTodo(title);
          return reply(todo, `Added ${formatTodo(todo)}`);
        }
        case "done":
        case "undo": {
          if (todoId === undefined || args.length !== 1) break;
          const todo = await setTodoDone(todoId, command === "done");
          if (todo === null) return notFound(todoId);
          return reply(todo, formatTodo(todo));
        }
        case "remove": {
          if (todoId === undefined || args.length !== 1) break;
          if (!(await removeTodo(todoId))) return notFound(todoId);
          return reply({ removed: true, id: todoId }, `Removed ${todoId}`);
        }
      }
      return { exitCode: 1, stderr: usage };
    },
  });

  // Cleanup on reload/disable/shutdown; hooks run LIFO. The sanctioned place
  // to clear timers and close connections.
  bb.onDispose(() => {
    bb.log.info("disposed");
  });

  // Long-lived background work: starts after load, gets an AbortSignal on
  // reload/disable/shutdown, and restarts with backoff if it crashes. Sleeps
  // must wake on abort — a plain setTimeout sleeps through the stop window
  // and the plugin reports "degraded (service did not stop)" on reload.
  // bb.background.service("worker", {
  //   async start(signal) {
  //     while (!signal.aborted) {
  //       await new Promise((resolve) => {
  //         const timer = setTimeout(resolve, 60_000);
  //         signal.addEventListener(
  //           "abort",
  //           () => { clearTimeout(timer); resolve(undefined); },
  //           { once: true },
  //         );
  //       });
  //     }
  //   },
  // });
}
