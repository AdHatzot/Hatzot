import { InfoBarItem } from "./MapShell";

export function MapInfoBar({
  infoItems,
}: {
  infoItems: InfoBarItem[];
}): JSX.Element {
  return (
    <div
      data-testid="map-info-bar"
      className="absolute bottom-3 left-3/4 z-[1000] flex -translate-x-1/2 items-center gap-5 rounded border border-line bg-panel/95 px-5 py-2 shadow rounded"
    >
      {infoItems.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <div className="flex shrink-0 flex-col leading-tight">
            <span className="whitespace-nowrap text-xs text-text">
              {item.label}
            </span>
            <span className="text-sm font-semibold text-text">
              {item.count}
            </span>
          </div>
          <div className="h1">{item.icon}</div>
        </div>
      ))}
    </div>
  );
}
