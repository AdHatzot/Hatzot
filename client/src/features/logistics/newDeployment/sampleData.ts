import { CsvRow } from "./types";

export const SAMPLE_DEPLOYMENT_NAME = "פריסת צפון — ספטמבר 2026";
export const SAMPLE_FILE_NAME = "north_deployment_2026.csv";

export const SAMPLE_CSV_ROWS: CsvRow[] = [
  // 6 ShieldNest-Lite
  {
    launcher_type_name: "ShieldNest-Lite",
    longitude: "34.9983",
    latitude: "32.8191",
    asl: "120",
    agl: "5",
    amount: "24",
  },
  {
    launcher_type_name: "ShieldNest-Lite",
    longitude: "35.0845",
    latitude: "32.9512",
    asl: "340",
    agl: "6",
    amount: "20",
  },
  {
    launcher_type_name: "ShieldNest-Lite",
    longitude: "35.1950",
    latitude: "32.7341",
    asl: "210",
    agl: "6",
    amount: "20",
  },
  {
    launcher_type_name: "ShieldNest-Lite",
    longitude: "34.8821",
    latitude: "32.0834",
    asl: "45",
    agl: "8",
    amount: "18",
  },
  {
    launcher_type_name: "ShieldNest-Lite",
    longitude: "34.8412",
    latitude: "31.7825",
    asl: "115",
    agl: "5",
    amount: "18",
  },
  {
    launcher_type_name: "ShieldNest-Lite",
    longitude: "34.7215",
    latitude: "31.3340",
    asl: "180",
    agl: "7",
    amount: "16",
  },

  // 4 IronHook-SR
  {
    launcher_type_name: "IronHook-SR",
    longitude: "35.5720",
    latitude: "33.1850",
    asl: "520",
    agl: "8",
    amount: "12",
  },
  {
    launcher_type_name: "IronHook-SR",
    longitude: "35.1450",
    latitude: "32.7120",
    asl: "140",
    agl: "10",
    amount: "10",
  },
  {
    launcher_type_name: "IronHook-SR",
    longitude: "34.9350",
    latitude: "32.2210",
    asl: "55",
    agl: "9",
    amount: "10",
  },
  {
    launcher_type_name: "IronHook-SR",
    longitude: "34.8510",
    latitude: "31.4250",
    asl: "260",
    agl: "11",
    amount: "8",
  },

  // 3 HorizonEye-MX
  {
    launcher_type_name: "HorizonEye-MX",
    longitude: "35.4210",
    latitude: "32.9810",
    asl: "780",
    agl: "12",
    amount: "4",
  },
  {
    launcher_type_name: "HorizonEye-MX",
    longitude: "34.9920",
    latitude: "32.3550",
    asl: "95",
    agl: "14",
    amount: "4",
  },
  {
    launcher_type_name: "HorizonEye-MX",
    longitude: "34.9750",
    latitude: "31.8520",
    asl: "245",
    agl: "11",
    amount: "3",
  },

  // 5 CloudFence-Area
  {
    launcher_type_name: "CloudFence-Area",
    longitude: "35.5910",
    latitude: "33.2210",
    asl: "620",
    agl: "4",
    amount: "16",
  },
  {
    launcher_type_name: "CloudFence-Area",
    longitude: "35.2950",
    latitude: "32.9150",
    asl: "290",
    agl: "3",
    amount: "16",
  },
  {
    launcher_type_name: "CloudFence-Area",
    longitude: "35.2890",
    latitude: "32.6120",
    asl: "110",
    agl: "4",
    amount: "14",
  },
  {
    launcher_type_name: "CloudFence-Area",
    longitude: "34.9210",
    latitude: "32.4350",
    asl: "35",
    agl: "5",
    amount: "14",
  },
  {
    launcher_type_name: "CloudFence-Area",
    longitude: "35.0120",
    latitude: "31.8920",
    asl: "220",
    agl: "4",
    amount: "12",
  },
];

export function createSampleCsvFile(): File {
  const headers = "launcher_type_name,longitude,latitude,asl,agl,amount\n";
  const body = SAMPLE_CSV_ROWS.map(
    (row) =>
      `${row.launcher_type_name},${row.longitude},${row.latitude},${row.asl},${row.agl},${row.amount}`,
  ).join("\n");
  const blob = new Blob([headers + body], { type: "text/csv" });
  return new File([blob], SAMPLE_FILE_NAME, { type: "text/csv" });
}
