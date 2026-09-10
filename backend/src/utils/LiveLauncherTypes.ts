export interface LauncherData {
  id: string;
  name: string;
  location: {
    lat: number | null;
    long: number | null;
  };
  range: number | null;
  interceptors: {
    name: string;
    amount: number;
  }[];
}