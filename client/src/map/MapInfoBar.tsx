import { InfoBarItem } from "./MapShell";

export function MapInfoBar({
  infoItems,
}: {
  infoItems: InfoBarItem[];
}): JSX.Element {
  return (
    <div
      data-testid="map-info-bar"
      className="absolute bottom-10 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-10 rounded border border-line bg-panel/95 px-10 py-4 shadow rounded"
    >
      {infoItems.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <div className="flex shrink-0 flex-col leading-tight">
            <span className="whitespace-nowrap text-s text-text">
              {item.label}
            </span>
            <span className="text-s font-semibold text-text">{item.count}</span>
          </div>
          {item.icon}
        </div>
      ))}
    </div>
  );
}
