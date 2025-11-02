import { parseDate } from "@/lib/date";
import type { Conflict, Task } from "@/lib/types";

/**
 * Determine if two tasks share at least one day of overlap.
 */
export function tasksOverlap(a: Task, b: Task): boolean {
  const aStart = parseDate(a.start);
  const aEnd = parseDate(a.end);
  const bStart = parseDate(b.start);
  const bEnd = parseDate(b.end);

  return aStart <= bEnd && bStart <= aEnd;
}

/**
 * Scan all tasks and return a list of conflicting pairs grouped by lane.
 */
export function detectConflicts(tasks: Task[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const tasksByLane = new Map<string, Task[]>();

  tasks.forEach((task) => {
    const laneTasks = tasksByLane.get(task.laneId) ?? [];
    laneTasks.push(task);
    tasksByLane.set(task.laneId, laneTasks);
  });

  tasksByLane.forEach((laneTasks, laneId) => {
    const sorted = [...laneTasks].sort((left, right) => {
      return parseDate(left.start).getTime() - parseDate(right.start).getTime();
    });

    for (let i = 0; i < sorted.length; i += 1) {
      for (let j = i + 1; j < sorted.length; j += 1) {
        const first = sorted[i];
        const second = sorted[j];

        if (!tasksOverlap(first, second)) {
          // Because the list is sorted, if the second task starts after the first ends
          // we can break early for this inner loop.
          if (parseDate(second.start) > parseDate(first.end)) {
            break;
          }
          continue;
        }

        conflicts.push({
          laneId,
          taskIds: [first.id, second.id],
        });
      }
    }
  });

  return conflicts;
}
