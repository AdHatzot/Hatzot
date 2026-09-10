import { CsvRow } from "./CsvRow";

export type NewDeployment = {
  name: string;
  file: File;
  rows: CsvRow[];
};