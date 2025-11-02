"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";

import { detectConflicts } from "@/lib/overlap";
import { getSeedSnapshot, loadTimeline, persistTimeline } from "@/lib/storage";
import {
  type Density,
  type ImportPayload,
  type Lane,
  type Task,
  type TimelineAction,
  type TimelineState,
  type TimelineSnapshot,
  type ZoomLevel,
} from "@/lib/types";

function createInitialState(): TimelineState {
  const snapshot = getSeedSnapshot();
  return enrichState(snapshot, {
    activeTaskId: null,
    hoveredTaskId: null,
    panelOpen: false,
    dirty: false,
  });
}

function enrichState(
  snapshot: TimelineSnapshot,
  extras: Pick<TimelineState, "activeTaskId" | "hoveredTaskId" | "panelOpen" | "dirty">,
): TimelineState {
  return {
    ...snapshot,
    ...extras,
    conflicts: detectConflicts(snapshot.tasks),
  };
}

function timelineReducer(state: TimelineState, action: TimelineAction): TimelineState {
  switch (action.type) {
    case "hydrate": {
      return enrichState(action.payload, {
        activeTaskId: null,
        hoveredTaskId: null,
        panelOpen: false,
        dirty: false,
      });
    }
    case "select": {
      return {
        ...state,
        activeTaskId: action.taskId,
      };
    }
    case "hover": {
      return {
        ...state,
        hoveredTaskId: action.taskId,
      };
    }
    case "togglePanel": {
      const open = action.open ?? !state.panelOpen;
      return {
        ...state,
        panelOpen: open,
      };
    }
    case "updateTask": {
      const tasks = state.tasks.map((task) => (task.id === action.task.id ? action.task : task));
      return {
        ...state,
        tasks,
        dirty: true,
        conflicts: detectConflicts(tasks),
      };
    }
    case "createTask": {
      const tasks = [...state.tasks, action.task];
      return {
        ...state,
        tasks,
        activeTaskId: action.task.id,
        panelOpen: true,
        dirty: true,
        conflicts: detectConflicts(tasks),
      };
    }
    case "deleteTask": {
      const tasks = state.tasks.filter((task) => task.id !== action.taskId);
      const activeTaskId = state.activeTaskId === action.taskId ? null : state.activeTaskId;
      return {
        ...state,
        tasks,
        activeTaskId,
        dirty: true,
        conflicts: detectConflicts(tasks),
      };
    }
    case "setTasks": {
      const tasks = [...action.tasks];
      return {
        ...state,
        tasks,
        dirty: true,
        conflicts: detectConflicts(tasks),
      };
    }
    case "setLanes": {
      return {
        ...state,
        lanes: [...action.lanes],
        dirty: true,
      };
    }
    case "setZoom": {
      if (state.zoom === action.zoom) {
        return state;
      }
      return {
        ...state,
        zoom: action.zoom,
        dirty: true,
      };
    }
    case "setDensity": {
      if (state.density === action.density) {
        return state;
      }
      return {
        ...state,
        density: action.density,
        dirty: true,
      };
    }
    default: {
      return state;
    }
  }
}

interface TimelineContextValue {
  state: TimelineState;
  selectTask: (taskId: string | null) => void;
  hoverTask: (taskId: string | null) => void;
  togglePanel: (open?: boolean) => void;
  updateTask: (task: Task) => void;
  createTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  setTasks: (tasks: Task[]) => void;
  setLanes: (lanes: Lane[]) => void;
  setZoom: (zoom: ZoomLevel) => void;
  setDensity: (density: Density) => void;
  importSnapshot: (payload: ImportPayload) => void;
  resetToSeed: () => void;
}

const TimelineContext = createContext<TimelineContextValue | null>(null);

export function TimelineProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(timelineReducer, undefined, createInitialState);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const snapshot = loadTimeline();
    dispatch({ type: "hydrate", payload: snapshot });
  }, []);

  useEffect(() => {
    if (!state.dirty) {
      return;
    }

    persistTimeline({
      lanes: state.lanes,
      tasks: state.tasks,
      zoom: state.zoom,
      density: state.density,
    });
  }, [state.density, state.dirty, state.lanes, state.tasks, state.zoom]);

  const actions = useMemo(() => {
    return {
      selectTask(taskId: string | null) {
        dispatch({ type: "select", taskId });
      },
      hoverTask(taskId: string | null) {
        dispatch({ type: "hover", taskId });
      },
      togglePanel(open?: boolean) {
        dispatch({ type: "togglePanel", open });
      },
      updateTask(task: Task) {
        dispatch({ type: "updateTask", task });
      },
      createTask(task: Task) {
        dispatch({ type: "createTask", task });
      },
      deleteTask(taskId: string) {
        dispatch({ type: "deleteTask", taskId });
      },
      setTasks(tasks: Task[]) {
        dispatch({ type: "setTasks", tasks });
      },
      setLanes(lanes: Lane[]) {
        dispatch({ type: "setLanes", lanes });
      },
      setZoom(zoom: ZoomLevel) {
        dispatch({ type: "setZoom", zoom });
      },
      setDensity(density: Density) {
        dispatch({ type: "setDensity", density });
      },
      importSnapshot(payload: ImportPayload) {
        dispatch({
          type: "hydrate",
          payload: {
            lanes: payload.lanes,
            tasks: payload.tasks,
            zoom: payload.zoom ?? state.zoom,
            density: payload.density ?? state.density,
          },
        });
      },
      resetToSeed() {
        const snapshot = getSeedSnapshot();
        dispatch({ type: "hydrate", payload: snapshot });
      },
    } satisfies Omit<TimelineContextValue, "state">;
  }, [dispatch, state.density, state.zoom]);

  const value = useMemo<TimelineContextValue>(() => {
    return {
      state,
      ...actions,
    };
  }, [actions, state]);

  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>;
}

export function useTimeline(): TimelineContextValue {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error("useTimeline must be used within a TimelineProvider");
  }
  return context;
}
