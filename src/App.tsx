import { useState } from "react";

interface Activity {
  id: number;
  start: number;
  end: number;
}

const activitiesData: Activity[] = [
  { id: 1, start: 1, end: 4 },
  { id: 2, start: 3, end: 5 },
  { id: 3, start: 0, end: 6 },
  { id: 4, start: 5, end: 7 },
  { id: 5, start: 3, end: 8 },
  { id: 6, start: 5, end: 9 },
  { id: 7, start: 6, end: 10 },
  { id: 8, start: 8, end: 11 },
  { id: 9, start: 8, end: 12 },
  { id: 10, start: 2, end: 13 },
  { id: 11, start: 12, end: 14 },
];

type StrategyKey = "end" | "start" | "duration" | "latestStart";

const strategies: Record<
  StrategyKey,
  {
    label: string;
    sortFn: (a: Activity, b: Activity) => number;
  }
> = {
  end: {
    label: "Earliest End Time (Optimal)",
    sortFn: (a, b) => a.end - b.end,
  },
  start: {
    label: "Earliest Start Time",
    sortFn: (a, b) => a.start - b.start,
  },
  duration: {
    label: "Shortest Duration",
    sortFn: (a, b) => a.end - a.start - (b.end - b.start),
  },
  latestStart: {
    label: "Latest Start Time",
    sortFn: (a, b) => b.start - a.start,
  },
};

const TIME_UNIT_WIDTH = 40;
const TIMELINE_END = Math.max(...activitiesData.map((a) => a.end));

const getRows = (activities: Activity[]): Activity[][] => {
  const sorted = [...activities].sort((a, b) => a.start - b.start);
  const rows: Activity[][] = [];

  for (const activity of sorted) {
    let placed = false;

    for (const row of rows) {
      if (row[row.length - 1].end <= activity.start) {
        row.push(activity);
        placed = true;
        break;
      }
    }

    if (!placed) {
      rows.push([activity]);
    }
  }

  return rows;
};

const ActivityTimeline = ({ selectedIds }: { selectedIds: number[] }) => {
  const rows = getRows(activitiesData);

  return (
    <div className="mt-6">
      <div className="flex text-xs text-gray-500 pl-4">
        {Array.from({ length: TIMELINE_END + 1 }).map((_, i) => (
          <div key={i} className="w-10 text-center border-r border-gray-300">
            {i}
          </div>
        ))}
      </div>

      <div className="space-y-2 mt-1">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex items-center h-12 relative">
            {row.map((act) => {
              const isSelected = selectedIds.includes(act.id);
              const left = act.start * TIME_UNIT_WIDTH;
              const width = (act.end - act.start) * TIME_UNIT_WIDTH;

              return (
                <div
                  key={act.id}
                  className={`absolute top-0 h-10 px-2 flex items-center justify-center rounded text-sm font-medium ${
                    isSelected
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-gray-800"
                  }`}
                  style={{
                    left: `${left}px`,
                    width: `${width}px`,
                  }}
                >
                  A{act.id} [{act.start},{act.end}]
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyKey>("end");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const runGreedy = () => {
    const sorted = [...activitiesData].sort(
      strategies[selectedStrategy].sortFn,
    );
    let endTime = 0;
    const result: number[] = [];

    for (const act of sorted) {
      if (act.start >= endTime) {
        result.push(act.id);
        endTime = act.end;
      }
    }
    setSelectedIds(result);
  };

  const getOptimalCount = (): number => {
    const sorted = [...activitiesData].sort((a, b) => a.end - b.end);
    let endTime = 0;
    let count = 0;

    for (const act of sorted) {
      if (act.start >= endTime) {
        count++;
        endTime = act.end;
      }
    }

    return count;
  };

  const optimalCount = getOptimalCount();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Activity Selection Visualizer</h1>

      <div className="mb-6 flex items-center gap-4">
        <label htmlFor="strategy" className="font-medium">
          Choose strategy:
        </label>
        <select
          id="strategy"
          value={selectedStrategy}
          onChange={(e) => setSelectedStrategy(e.target.value as StrategyKey)}
          className="p-2 border rounded"
        >
          {Object.entries(strategies).map(([key, strategy]) => (
            <option key={key} value={key}>
              {strategy.label}
            </option>
          ))}
        </select>

        <button
          onClick={runGreedy}
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Run
        </button>
      </div>

      <ActivityTimeline selectedIds={selectedIds} />

      {selectedIds.length > 0 && (
        <div className="mt-6 p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📊 Selection Summary
          </h2>

          <div className="grid grid-cols-2 gap-4 text-gray-800">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Strategy Used</span>
              <span className="font-medium">
                {strategies[selectedStrategy].label}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Activities Selected</span>
              <span className="font-medium">{selectedIds.length}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Optimal Activities</span>
              <span className="font-medium">{optimalCount}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Optimality Rate</span>
              <span className="font-medium">
                {((selectedIds.length / optimalCount) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded bg-gray-50 text-sm">
            {selectedIds.length === optimalCount ? (
              <div className="text-green-600 font-medium flex items-center gap-2">
                ✅ This strategy found the optimal solution.
              </div>
            ) : (
              <div className="text-yellow-600 font-medium flex items-center gap-2">
                ⚠️ This strategy did <strong>not</strong> find the optimal
                result.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
