"use client";

interface DependencyArrowProps {
  fromTaskId: string;
  toTaskId: string;
}

export function DependencyArrow({ fromTaskId, toTaskId }: DependencyArrowProps) {
  return (
    <svg
      aria-hidden="true"
      className="text-muted-foreground pointer-events-none absolute h-16 w-16"
      viewBox="0 0 64 64"
    >
      <defs>
        <marker
          id={`arrow-${fromTaskId}-${toTaskId}`}
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="currentColor" />
        </marker>
      </defs>
      <path
        d="M4 32 C 24 32, 40 32, 60 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        markerEnd={`url(#arrow-${fromTaskId}-${toTaskId})`}
      />
    </svg>
  );
}
