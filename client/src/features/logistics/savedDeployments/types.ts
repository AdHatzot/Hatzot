export type DeploymentStatusType = "Real" | "Saved" | "Draft";

export interface LiveLauncherItem {
  id: string | number;
  launcherTypeId?: number;
  deploymentId?: number;
  longitude?: number;
  latitude?: number;
  asl?: number;
  agl?: number;
  amount?: number;
  active?: boolean;
  status?: string;
  launcherType?: {
    id: number;
    name: string;
    reloadTimeS?: number | null;
    rangeM?: number | null;
  };
  name?: string;
  location?: {
    lat: number;
    long: number;
  };
  range?: number;
  interceptors?: Array<{
    name: string;
    amount: number;
  }>;
}

export interface DeploymentItem {
  id: number;
  name: string;
  status: DeploymentStatusType;
  liveLaunchers?: LiveLauncherItem[];
  updatedAt?: string;
}
