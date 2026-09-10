export type InterceptionResult = "hit" | "miss";

export interface Interception {
  id: string;

  interceptorId: string;
  targetId: string;

  start: {
    lat: number;
    lng: number;
  };

  target: {
    lat: number;
    lng: number;
  };

  result: InterceptionResult;

  durationMs: number;
}