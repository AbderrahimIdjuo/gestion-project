"use client";

const STATS_COLS = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 md:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
};

export function RapportEntete({
  title,
  leftLabel,
  leftValue,
  rightLabel = "Période",
  rightValue,
  extraItems = [],
  stats = [],
}) {
  const allStats = [
    ...(leftLabel != null
      ? [{ label: leftLabel, value: leftValue }]
      : []),
    ...(rightValue != null && rightValue !== ""
      ? [{ label: rightLabel, value: rightValue }]
      : []),
    ...extraItems,
    ...stats,
  ];

  const statsCols =
    STATS_COLS[allStats.length] ||
    "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6";

  return (
    <>
      {title ? (
        <h3 className="font-semibold text-gray-900 mb-4 print-block">
          {title}
        </h3>
      ) : null}

      {allStats.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 print-block">
          <div className={`grid ${statsCols} gap-4 text-center`}>
            {allStats.map((stat, index) => (
              <div key={`${stat.label}-${index}`} className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-600 mb-1">
                  {stat.label}
                </h3>
                <div
                  className={`text-lg font-bold break-words ${
                    stat.valueClassName || "text-gray-900"
                  }`}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
