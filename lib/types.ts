export type ZoomLevel = "week" | "month" | "quarter" | "year";

export type Density = "compact" | "comfortable" | "spacious";

export interface Lane {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  name: string;
  start: string; // ISO date string (inclusive)
  end: string; // ISO date string (inclusive)
  laneId: string;
  assignee: string;
  deps: string[];
  milestone?: boolean;
}

export interface TimelineSnapshot {
  lanes: Lane[];
  tasks: Task[];
  zoom: ZoomLevel;
  density: Density;
}

export interface TimelineState extends TimelineSnapshot {
  activeTaskId: string | null;
  hoveredTaskId: string | null;
  panelOpen: boolean;
  dirty: boolean;
  conflicts: Conflict[];
}

export type TimelineAction =
  | { type: "hydrate"; payload: TimelineSnapshot }
  | { type: "select"; taskId: string | null }
  | { type: "hover"; taskId: string | null }
  | { type: "togglePanel"; open?: boolean }
  | { type: "updateTask"; task: Task }
  | { type: "createTask"; task: Task }
  | { type: "deleteTask"; taskId: string }
  | { type: "setTasks"; tasks: Task[] }
  | { type: "setLanes"; lanes: Lane[] }
  | { type: "setZoom"; zoom: ZoomLevel }
  | { type: "setDensity"; density: Density };

export interface ImportPayload {
  lanes: Lane[];
  tasks: Task[];
  zoom?: ZoomLevel;
  density?: Density;
}

export interface Conflict {
  laneId: string;
  taskIds: [string, string];
}
