/**
 * @team     blue
 * @owner    blue-lead
 * @public   no
 * @updated  2026-09-10
 */

import L, { type LayerGroup, type Map as LeafletMap } from "leaflet";

const API_BASE_URL = "http://localhost:3000";

type Interceptor = {
  name: string;
  amount: number;
};

type Launcher = {
  id: string;
  name: string;
  location: {
    lat: number;
    long: number;
  };
  range: number;
  interceptors: Interceptor[];
};

function createLauncherPopup(launcher: Launcher): string {
  const interceptors = Array.isArray(launcher.interceptors)
    ? launcher.interceptors
    : [];

  const interceptorRows =
    interceptors.length > 0
      ? interceptors
        .map(
          (interceptor) => `
              <tr>
                <td style="
                  padding:8px 4px;
                  text-align:right;
                  direction:ltr;
                  border-bottom:1px solid #30353b;
                ">
                  ${interceptor.name}
                </td>

                <td style="
                  padding:8px 4px;
                  width:60px;
                  text-align:center;
                  border-bottom:1px solid #30353b;
                  font-weight:700;
                ">
                  ${interceptor.amount}
                </td>
              </tr>
            `,
        )
        .join("")
      : `
          <tr>
            <td
              colspan="2"
              style="
                padding:10px 4px;
                text-align:center;
                color:#aeb5bc;
              "
            >
              אין מיירטים במלאי
            </td>
          </tr>
        `;

  return `
    <div
      dir="rtl"
      style="
        width:250px;
        background:#11161b;
        color:#f4f4f4;
        border-radius:10px;
        padding:14px;
        font-family:Arial,sans-serif;
        box-sizing:border-box;
      "
    >

      <!-- Header -->

      <div style="
        display:flex;
        align-items:center;
        gap:10px;
        direction:rtl;
        text-align:right;
      ">

        <img
          src="/icons/blue-marker.svg"
          alt=""
          style="
            width:32px;
            height:32px;
            object-fit:contain;
            flex-shrink:0;
          "
        />

        <div style="
          flex:1;
          direction:rtl;
          text-align:right;
        ">

          <div style="
            font-size:16px;
            font-weight:700;
          ">
            ${launcher.name}
          </div>

          <div style="
            font-size:12px;
            color:#aeb5bc;
            margin-top:3px;
          ">
            מזהה המשגר: ${launcher.id}
          </div>

        </div>

      </div>

      <div style="
        height:1px;
        background:#30353b;
        margin:12px 0;
      "></div>

      <!-- טווח שיגור -->

      <div style="
        display:flex;
        align-items:center;
        margin:8px 0;
        gap:10px;
      ">

        <div style="
          width:22px;
          height:22px;
          display:flex;
          align-items:center;
          justify-content:center;
          flex-shrink:0;
        ">

          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="9"/>
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 3v3"/>
            <path d="M12 18v3"/>
            <path d="M3 12h3"/>
            <path d="M18 12h3"/>
          </svg>

        </div>

        <span style="
          color:#aeb5bc;
          flex:1;
          text-align:right;
        ">
          טווח שיגור
        </span>

        <strong style="
          text-align:left;
          direction:rtl;
        ">
          ${(launcher.range / 1000).toLocaleString()} ק"מ
        </strong>

      </div>

      <!-- מיקום המשגר -->

      <div style="
        display:flex;
        align-items:center;
        margin:8px 0;
        gap:10px;
      ">

        <div style="
          width:22px;
          height:22px;
          display:flex;
          align-items:center;
          justify-content:center;
          flex-shrink:0;
        ">

          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="
              M12 21
              s7-6.2 7-12
              a7 7 0 1 0-14 0
              c0 5.8 7 12 7 12z
            "/>

            <circle
              cx="12"
              cy="9"
              r="2.5"
            />
          </svg>

        </div>

        <span style="
          color:#aeb5bc;
          flex:1;
          text-align:right;
        ">
          מיקום המשגר
        </span>

        <strong style="
          font-size:12px;
          direction:ltr;
          text-align:left;
          white-space:nowrap;
        ">
          ${launcher.location.lat.toFixed(4)},
          ${launcher.location.long.toFixed(4)}
        </strong>

      </div>

      <div style="
        height:1px;
        background:#30353b;
        margin:12px 0;
      "></div>

      <!-- טילי יירוט -->

      <div style="
        display:flex;
        align-items:center;
        gap:10px;
        font-weight:700;
        margin-bottom:10px;
      ">

        <div style="
          width:22px;
          height:22px;
          display:flex;
          align-items:center;
          justify-content:center;
          flex-shrink:0;
        ">

          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="white"
          >

            <path d="
              M14.5 2
              C18 3
              20.5 5.5
              22 9
              L15 16
              L10 11
              Z
            "/>

            <path d="
              M10 11
              L5 16
              L8 19
              L13 14
              Z
            "/>

            <path d="
              M5 16
              L2 22
              L8 19
              Z
            "/>

          </svg>

        </div>

        <span>
          טילי יירוט
        </span>

      </div>

      <!-- טבלת מיירטים -->

      <table style="
        width:100%;
        border-collapse:collapse;
        table-layout:fixed;
        font-size:12px;
      ">

        <thead>
          <tr style="
            color:#aeb5bc;
            border-bottom:1px solid #30353b;
          ">

            <th style="
              padding:6px 4px;
              text-align:right;
              font-weight:400;
            ">
              שם
            </th>

            <th style="
              padding:6px 4px;
              width:60px;
              text-align:center;
              font-weight:400;
            ">
              כמות
            </th>

          </tr>
        </thead>

        <tbody>
          ${interceptorRows}
        </tbody>

      </table>

    </div>
  `;
}

export async function mountBlueLayer(
  group: LayerGroup,
  _map: LeafletMap,
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/logistics/launcher-data`);

    if (!response.ok) {
      throw new Error(`Failed to fetch launcher data: ${response.status}`);
    }

    const launchers: Launcher[] = await response.json();

    const blueIcon = L.icon({
      iconUrl: "/icons/blue-marker.svg",
      iconSize: [20, 20],
      iconAnchor: [16, 16],
    });

    const cloudFenceIcon = L.icon({
      iconUrl: "/icons/CloudFence-Area.svg",
      iconSize: [20, 20],
      iconAnchor: [16, 16],
    });

    const horizonEyeIcon = L.icon({
      iconUrl: "/icons/HorizonEye-MX.svg",
      iconSize: [20, 20],
      iconAnchor: [16, 16],
    });

    const ironHookIcon = L.icon({
      iconUrl: "/icons/IronHook-SR.svg",
      iconSize: [20, 20],
      iconAnchor: [16, 16],
    });

    launchers.forEach((launcher) => {
      let icon: any = blueIcon;
      let color: string = "#1A8BE8"

      switch (launcher.name) {
        case "ShieldNest-Lite":
          icon = blueIcon;
          break;
        case "CloudFence-Area":
          icon = cloudFenceIcon;
          color = "#AF7DE8";
          break;
        case "IronHook-SR":
          icon = ironHookIcon;
          color = "#ED9E5F";
          break;
        case "HorizonEye-MX":
          icon = horizonEyeIcon;
          color = "#87BD66";
          break;
      }

      L.circle([launcher.location.lat, launcher.location.long], {
        radius: launcher.range / 2,
        color: color,
        fillColor: color,
        fillOpacity: 0.05,
        opacity: 0.15,
        weight: 0.5,
      }).addTo(group);

      L.marker([launcher.location.lat, launcher.location.long], {
        icon: icon,
      })
        .bindPopup(createLauncherPopup(launcher), {
          className: "blue-launcher-popup",
          closeButton: true,
          maxWidth: 280,
          minWidth: 280,
        })
        .addTo(group);
    });

    const styleId = "blue-launcher-popup-styles";

    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");

      style.id = styleId;

      style.innerHTML = `
        .blue-launcher-popup
        .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }

        .blue-launcher-popup
        .leaflet-popup-content {
          margin: 0 !important;
          width: 280px !important;
        }

        .blue-launcher-popup
        .leaflet-popup-tip {
          background: #11161b !important;
          box-shadow: none !important;
        }
      `;

      document.head.appendChild(style);
    }
  } catch (error) {
    console.error("Failed to load blue launcher layer:", error);
  }
}
