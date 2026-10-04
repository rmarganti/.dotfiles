import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { definePluginApp, useRealtime, useRpc } from "@get-bb/plugin-sdk/app";
import type { rpcContract, Todo } from "./server";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Category = Todo["category"];
const QUICK_ADD_EVENT = "bb-todo:quick-add";

function useTodos() {
  const rpc = useRpc<typeof rpcContract>();
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const report = useCallback((cause: unknown) => setError(cause instanceof Error ? cause.message : String(cause)), []);
  const refetch = useCallback(() => {
    rpc.call("todos_list").then((result) => { setTodos(result.todos); setError(null); }, report);
  }, [rpc, report]);
  useEffect(refetch, [refetch]);
  useRealtime("todos-changed", refetch);
  return { rpc, todos, error, report };
}

function TaskForm({ compact = false, onAdded }: { compact?: boolean; onAdded?: () => void }) {
  const { rpc, report } = useTodos();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("work");
  const [dueDate, setDueDate] = useState("");
  const [pending, setPending] = useState(false);
  const add = async (event: FormEvent) => {
    event.preventDefault();
    if (title.trim() === "" || pending) return;
    setPending(true);
    try {
      await rpc.call("todos_add", { title: title.trim(), category, dueDate: dueDate || null });
      setTitle(""); setDueDate(""); onAdded?.();
    } catch (cause) { report(cause); } finally { setPending(false); }
  };
  return (
    <form onSubmit={add} className={cn("grid gap-2", !compact && "sm:grid-cols-[1fr_auto_auto_auto]")}>
      <Input autoFocus={compact} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs doing?" aria-label="Task title" />
      <select value={category} onChange={(event) => setCategory(event.target.value as Category)} aria-label="Category" className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <option value="work">Work</option><option value="personal">Personal</option>
      </select>
      <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} aria-label="Due date" />
      <Button type="submit" disabled={pending || title.trim() === ""}><Icon name="Plus" className="size-4" /> Add</Button>
    </form>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">{children}</div>;
}

function TodoRow({ todo, selected, onSelect }: { todo: Todo; selected: boolean; onSelect: () => void }) {
  const { rpc, report } = useTodos();
  const overdue = !todo.done && todo.dueDate !== null && todo.dueDate < new Date().toISOString().slice(0, 10);
  return (
    <li tabIndex={selected ? 0 : -1} onFocus={onSelect} onClick={onSelect} className={cn("flex items-center gap-3 px-3 py-2.5 text-sm outline-none", selected && "bg-accent")}>
      <Checkbox checked={todo.done} onCheckedChange={(checked) => void rpc.call("todos_set_done", { id: todo.id, done: checked === true }).catch(report)} aria-label={`Toggle ${todo.title}`} />
      <div className="min-w-0 flex-1">
        <div className={cn("truncate", todo.done && "text-muted-foreground line-through")}>{todo.title}</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">{todo.category}</span>
          {todo.dueDate && <span className={cn("text-xs text-muted-foreground", overdue && "font-medium text-destructive")}>Due {todo.dueDate}</span>}
        </div>
      </div>
      <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" aria-label={`Remove ${todo.title}`} onClick={() => void rpc.call("todos_remove", { id: todo.id }).catch(report)}><Icon name="Trash2" className="size-4" /></Button>
    </li>
  );
}

function TodosPage() {
  const { rpc, todos, error, report } = useTodos();
  const [filter, setFilter] = useState<"open" | "all" | Category>("open");
  const [selected, setSelected] = useState(0);
  const visible = useMemo(() => (todos ?? []).filter((todo) => filter === "open" ? !todo.done : filter === "all" ? true : todo.category === filter), [filter, todos]);
  useEffect(() => setSelected((value) => Math.min(value, Math.max(visible.length - 1, 0))), [visible.length]);
  const handleKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).matches("input, select, button")) return;
    if (event.key === "j" || event.key === "ArrowDown") setSelected((value) => Math.min(value + 1, visible.length - 1));
    else if (event.key === "k" || event.key === "ArrowUp") setSelected((value) => Math.max(value - 1, 0));
    else if (event.key === " " && visible[selected]) { const todo = visible[selected]; void rpc.call("todos_set_done", { id: todo.id, done: !todo.done }).catch(report); }
    else return;
    event.preventDefault();
  };
  const openCount = todos?.filter((todo) => !todo.done).length ?? 0;
  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto" onKeyDown={handleKeys} tabIndex={0}>
      <div className="mx-auto box-border w-full max-w-3xl px-4 pb-8 pt-4 md:px-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div><h2 className="text-lg font-semibold">Tasks</h2><p className="text-sm text-muted-foreground">{openCount} open · use j/k and Space in the list</p></div>
          <Button variant="outline" onClick={() => window.dispatchEvent(new Event(QUICK_ADD_EVENT))}><Icon name="Keyboard" className="size-4" /> Quick add</Button>
        </div>
        <TaskForm />
        <div className="my-4 flex gap-1" role="group" aria-label="Task filter">
          {(["open", "work", "personal", "all"] as const).map((value) => <Button key={value} size="sm" variant={filter === value ? "secondary" : "ghost"} onClick={() => setFilter(value)} className="capitalize">{value}</Button>)}
        </div>
        {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
        {todos === null ? <EmptyState>Loading tasks…</EmptyState> : visible.length === 0 ? <EmptyState>No tasks in this view.</EmptyState> : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">{visible.map((todo, index) => <TodoRow key={todo.id} todo={todo} selected={index === selected} onSelect={() => setSelected(index)} />)}</ul>
        )}
      </div>
    </div>
  );
}

function OpenTaskCount() {
  const { todos } = useTodos();
  return <span className="text-xs tabular-nums text-muted-foreground">{todos?.filter((todo) => !todo.done).length ?? "…"}</span>;
}

function QuickAddOverlay() {
  const [open, setOpen] = useState(false);
  useEffect(() => { const show = () => setOpen(true); window.addEventListener(QUICK_ADD_EVENT, show); return () => window.removeEventListener(QUICK_ADD_EVENT, show); }, []);
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Quick add task</DialogTitle><DialogDescription>Capture a task without leaving the current BB surface.</DialogDescription></DialogHeader><TaskForm compact onAdded={() => setOpen(false)} /></DialogContent></Dialog>;
}

function FooterTasks({ dismiss }: { dismiss: () => void }) {
  const { rpc, todos, report } = useTodos();
  const open = (todos ?? []).filter((todo) => !todo.done).slice(0, 5);
  return (
    <div className="w-72 p-3">
      <div className="mb-2 flex items-center justify-between"><strong className="text-sm">Next tasks</strong><Button variant="ghost" size="icon" className="size-7" onClick={dismiss} aria-label="Close"><Icon name="X" className="size-4" /></Button></div>
      {open.length === 0 ? <p className="text-sm text-muted-foreground">Nothing open.</p> : <ul className="space-y-1">{open.map((todo) => <li key={todo.id} className="flex items-center gap-2 rounded-md px-1 py-1 text-sm"><Checkbox checked={false} onCheckedChange={() => void rpc.call("todos_set_done", { id: todo.id, done: true }).catch(report)} aria-label={`Complete ${todo.title}`} /><span className="min-w-0 flex-1 truncate">{todo.title}</span></li>)}</ul>}
      <Button className="mt-3 w-full" size="sm" onClick={() => window.dispatchEvent(new Event(QUICK_ADD_EVENT))}>Add task</Button>
    </div>
  );
}

export default definePluginApp((app) => {
  app.slots.navPanel({ id: "todos", title: "To-Do", icon: "ListTodo", path: "todos", component: TodosPage, experimental_sidebarAccessory: OpenTaskCount });
  app.slots.experimental_appOverlay({ id: "quick-add", component: QuickAddOverlay });
  app.experimental_sidebarFooter.register({ kind: "disclosure", id: "tasks", label: "Quick tasks", icon: "ListTodo", component: FooterTasks });
  app.commands.register({ id: "quick-add", title: "To-Do: Quick add task", defaultShortcut: { key: "t", mod: true, shift: true }, run: () => { window.dispatchEvent(new Event(QUICK_ADD_EVENT)); } });
});
