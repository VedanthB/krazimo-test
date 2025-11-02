"use client";

import { isAfter } from "date-fns";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, Trash2, X } from "lucide-react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useTimeline } from "@/hooks/useTimeline";
import { parseDate, toISODate } from "@/lib/date";
import { cn } from "@/lib/utils";

interface TaskFormState {
  name: string;
  start: string;
  end: string;
  laneId: string;
  assignee: string;
  deps: string[];
  milestone: boolean;
}

const emptyForm: TaskFormState = {
  name: "",
  start: toISODate(new Date()),
  end: toISODate(new Date()),
  laneId: "",
  assignee: "",
  deps: [],
  milestone: false,
};

/**
 * Determine whether two task form states are identical.
 */
function formsEqual(left: TaskFormState, right: TaskFormState) {
  return (
    left.name === right.name &&
    left.start === right.start &&
    left.end === right.end &&
    left.laneId === right.laneId &&
    left.assignee === right.assignee &&
    left.milestone === right.milestone &&
    left.deps.length === right.deps.length &&
    left.deps.every((dep, index) => dep === right.deps[index])
  );
}

/**
 * Drawer surface that lets users edit metadata for the currently selected task.
 */
export function TaskPanel() {
  const { state, togglePanel, updateTask, deleteTask } = useTimeline();
  const activeTask = state.tasks.find((task) => task.id === state.activeTaskId) ?? null;
  const lanes = useMemo(() => state.lanes, [state.lanes]);

  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const panelOpen = state.panelOpen;

  useEffect(() => {
    const laneFallback = lanes[0]?.id ?? "";
    const next: TaskFormState = activeTask
      ? {
          name: activeTask.name,
          start: activeTask.start,
          end: activeTask.end,
          laneId: activeTask.laneId,
          assignee: activeTask.assignee,
          deps: [...activeTask.deps],
          milestone: activeTask.milestone ?? activeTask.start === activeTask.end,
        }
      : {
          ...emptyForm,
          laneId: laneFallback,
        };

    const frame = requestAnimationFrame(() => {
      setForm((previous) => (formsEqual(previous, next) ? previous : next));
      setErrors({});
    });

    return () => cancelAnimationFrame(frame);
  }, [activeTask, lanes]);

  const availableDependencies = useMemo(() => {
    if (!activeTask) {
      return [];
    }
    return state.tasks.filter((task) => task.id !== activeTask.id);
  }, [activeTask, state.tasks]);

  const disabled = !activeTask;
  const milestoneChecked = form.milestone;

  const handleTextChange =
    (field: "name" | "assignee") => (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((previous) => ({
        ...previous,
        [field]: event.target.value,
      }));
    };

  const handleDateChange =
    (field: "start" | "end") => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setForm((previous) => {
        if (field === "start") {
          return {
            ...previous,
            start: value,
            end: previous.milestone ? value : previous.end,
          };
        }
        return {
          ...previous,
          end: value,
          milestone: previous.milestone && value === previous.start,
        };
      });
    };

  const handleMilestoneToggle = (checked: boolean) => {
    setForm((previous) => ({
      ...previous,
      milestone: checked,
      end: checked ? previous.start : previous.end,
    }));
  };

  const handleDependencyToggle = (taskId: string) => {
    setForm((previous) => {
      const exists = previous.deps.includes(taskId);
      const nextDeps = exists
        ? previous.deps.filter((dep) => dep !== taskId)
        : [...previous.deps, taskId];
      return {
        ...previous,
        deps: nextDeps,
      };
    });
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) {
      nextErrors.name = "Task name is required.";
    }
    const startDate = parseDate(form.start);
    const endDate = parseDate(form.milestone ? form.start : form.end);
    if (isAfter(startDate, endDate)) {
      nextErrors.end = "End date must be on or after the start date.";
    }
    if (!form.laneId) {
      nextErrors.laneId = "Select a lane.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeTask) {
      return;
    }
    if (!validate()) {
      return;
    }
    setIsSaving(true);
    const start = toISODate(form.start);
    const end = form.milestone ? start : toISODate(form.end);
    updateTask({
      ...activeTask,
      name: form.name.trim(),
      start,
      end,
      assignee: form.assignee,
      laneId: form.laneId,
      deps: form.deps.filter((dep) => dep !== activeTask.id),
      milestone: form.milestone,
    });
    setTimeout(() => setIsSaving(false), 300);
  };

  const handleReset = () => {
    if (!activeTask) {
      togglePanel(false);
      return;
    }
    setForm({
      name: activeTask.name,
      start: activeTask.start,
      end: activeTask.end,
      laneId: activeTask.laneId,
      assignee: activeTask.assignee,
      deps: [...activeTask.deps],
      milestone: activeTask.milestone ?? activeTask.start === activeTask.end,
    });
    setErrors({});
  };

  const handleDelete = () => {
    if (!activeTask) {
      return;
    }
    const confirmation = window.confirm(`Delete "${activeTask.name}"? This cannot be undone.`);
    if (!confirmation) {
      return;
    }
    deleteTask(activeTask.id);
    togglePanel(false);
  };

  const selectedDependencyNames = form.deps
    .map((id) => state.tasks.find((task) => task.id === id)?.name)
    .filter(Boolean);

  return (
    <Drawer open={panelOpen} onOpenChange={(open) => togglePanel(open)} direction="right">
      <DrawerContent className="bg-card h-full w-full border-l sm:max-w-md md:max-w-xl lg:max-w-2xl">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          {/* Panel header */}
          <DrawerHeader className="flex items-start justify-between gap-4 border-b px-6 pt-6 pb-4">
            <div className="space-y-1">
              <DrawerTitle>{activeTask ? activeTask.name : "Task details"}</DrawerTitle>
              <DrawerDescription>
                {activeTask
                  ? "Adjust scheduling, ownership, and dependencies for this task."
                  : "Select a task from the timeline to view and edit details."}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close panel</span>
              </Button>
            </DrawerClose>
          </DrawerHeader>

          {/* Scrollable form */}
          <div className="timeline-drawer-scroll flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-6">
              {/* Basic details */}
              <section className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="task-name">Task name</Label>
                  <Input
                    id="task-name"
                    value={form.name}
                    onChange={handleTextChange("name")}
                    placeholder="e.g. Design system audit"
                    disabled={disabled}
                  />
                  {errors.name ? <p className="text-destructive text-xs">{errors.name}</p> : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="task-start">Start date</Label>
                    <Input
                      id="task-start"
                      type="date"
                      value={form.start}
                      onChange={handleDateChange("start")}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-end">End date</Label>
                    <Input
                      id="task-end"
                      type="date"
                      value={form.end}
                      onChange={handleDateChange("end")}
                      disabled={disabled || milestoneChecked}
                    />
                    {errors.end ? <p className="text-destructive text-xs">{errors.end}</p> : null}
                  </div>
                </div>

                <div className="border-border bg-muted/40 flex items-center justify-between rounded-lg border px-3 py-3">
                  <div>
                    <p className="text-foreground text-sm font-medium">Milestone</p>
                    <p className="text-muted-foreground text-xs">
                      Zero duration task — end date locks to the start date.
                    </p>
                  </div>
                  <Switch
                    id="task-milestone"
                    checked={milestoneChecked}
                    onCheckedChange={handleMilestoneToggle}
                    disabled={disabled}
                  />
                </div>
              </section>

              <Separator />

              {/* Lane & assignee */}
              <section className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="task-lane">Lane</Label>
                  <Select
                    value={form.laneId}
                    onValueChange={(value) =>
                      setForm((previous) => ({
                        ...previous,
                        laneId: value,
                      }))
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger id="task-lane">
                      <SelectValue placeholder="Select a lane" />
                    </SelectTrigger>
                    <SelectContent>
                      {lanes.map((lane) => (
                        <SelectItem key={lane.id} value={lane.id}>
                          {lane.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.laneId ? (
                    <p className="text-destructive text-xs">{errors.laneId}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-assignee">Assignee</Label>
                  <Input
                    id="task-assignee"
                    value={form.assignee}
                    onChange={handleTextChange("assignee")}
                    placeholder="Name or team"
                    disabled={disabled}
                  />
                </div>
              </section>

              <Separator />

              {/* Dependencies */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Dependencies</Label>
                    <p className="text-muted-foreground text-xs">
                      Tasks listed here must complete before this task begins.
                    </p>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {selectedDependencyNames.length > 0
                      ? `${selectedDependencyNames.length} selected`
                      : "None"}
                  </span>
                </div>
                <div
                  className={cn(
                    "border-border rounded-lg border",
                    availableDependencies.length > 0 ? "bg-muted/30" : "bg-muted/50",
                  )}
                >
                  <div className="timeline-drawer-scroll max-h-48 space-y-2 overflow-y-auto px-3 py-3">
                    {availableDependencies.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No other tasks available.</p>
                    ) : (
                      availableDependencies.map((task) => {
                        const checked = form.deps.includes(task.id);
                        return (
                          <label
                            key={task.id}
                            className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-indigo-500"
                              checked={checked}
                              onChange={() => handleDependencyToggle(task.id)}
                              disabled={disabled}
                            />
                            <span className="text-foreground truncate text-sm">{task.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
                {selectedDependencyNames.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedDependencyNames.map((name) => (
                      <span
                        key={name}
                        className="bg-primary/10 text-primary inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </section>
            </div>
          </div>

          {/* Footer actions */}
          <DrawerFooter className="bg-muted/40 border-t px-6 py-4">
            <div className="flex w-full items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={disabled}
                className="text-destructive gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete task
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={handleReset}>
                  Reset
                </Button>
                <Button type="submit" disabled={disabled || isSaving} className="gap-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save changes
                </Button>
              </div>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
