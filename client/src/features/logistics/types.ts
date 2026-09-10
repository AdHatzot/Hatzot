export interface DeploymentItem {
  id: number;
  name: string;
  status?: string;
}

export interface DeploymentLauncherPoint {
  deployment: DeploymentItem;
  launcherId: string | number;
  location: {
    latitude: number;
    longitude: number;
    asl: number;
    agl: number;
  };
  ammunitionAmount: number;
}
