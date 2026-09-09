/**
 * @team     blue
 * @owner    blue-lead
 * @public   no
 * @updated  2026-09-09
 */

import L, {
  type LayerGroup,
  type Map as LeafletMap,
} from "leaflet";

type Interceptor = {
  name: string;
  amount: number;
};

type Launcher = {
  id: number;
  name: string;
  location: {
    lat: number;
    long: number;
  };
  range: number;
};

const launchers: Launcher[] = [
  {
    id: 1,
    name: "ShieldNest-Lite",
    location: {
      lat: 33.0512,
      long: 35.2845,
    },
    range: 40000,
  },
  {
    id: 2,
    name: "ShieldNest-Lite",
    location: {
      lat: 32.8341,
      long: 35.195,
    },
    range: 40000,
  },
  {
    id: 3,
    name: "IronHook-SR",
    location: {
      lat: 33.185,
      long: 35.572,
    },
    range: 60000,
  },
  {
    id: 4,
    name: "HorizonEye-MX",
    location: {
      lat: 32.981,
      long: 35.421,
    },
    range: 25000,
  },
];

const launcherInterceptors: Record<number, Interceptor[]> = {
  1: [
    {
      name: "BuzzStop-15",
      amount: 6,
    },
    {
      name: "NetWing-30",
      amount: 2,
    },
  ],

  2: [
    {
      name: "SwarmMist-5",
      amount: 500,
    },
  ],

  3: [
    {
      name: "BuzzStop-15",
      amount: 8,
    },
    {
      name: "DartFox-S",
      amount: 4,
    },
    {
      name: "SpearMini-70",
      amount: 2,
    },
  ],

  4: [
    {
      name: "MicroNet-R",
      amount: 10,
    },
    {
      name: "NetWing-30",
      amount: 5,
    },
  ],
};

function createLauncherPopup(
  launcher: Launcher,
): string {
  const interceptors =
    launcherInterceptors[launcher.id] ?? [];

  const interceptorRows = interceptors
    .map(
      (interceptor) => `
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          padding:7px 0;
          border-bottom:1px solid #30353b;
        ">

          <span style="
            flex:1;
            text-align:right;
            direction:ltr;
          ">
            ${interceptor.name}
          </span>

          <strong style="
            width:50px;
            text-align:center;
          ">
            ${interceptor.amount}
          </strong>

        </div>
      `,
    )
    .join("");

  return `
    <div dir="rtl" style="
      width:250px;
      background:#11161b;
      color:#f4f4f4;
      border-radius:10px;
      padding:14px;
      font-family:Arial,sans-serif;
      box-sizing:border-box;
    ">

      <!-- Header - RTL -->

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

        <!-- שם השדה בצד ימין -->

        <span style="
          color:#aeb5bc;
          flex:1;
          text-align:right;
        ">
          טווח שיגור
        </span>

        <!-- הנתון בצד שמאל -->

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

        <!-- שם השדה בצד ימין -->

        <span style="
          color:#aeb5bc;
          flex:1;
          text-align:right;
        ">
          מיקום המשגר
        </span>

        <!-- הנתון בצד שמאל -->

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


      <!-- כותרות שם וכמות -->

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:6px 0;
        color:#aeb5bc;
        font-size:12px;
        border-bottom:1px solid #30353b;
      ">

        <span style="
          flex:1;
          text-align:right;
        ">
          שם
        </span>

        <span style="
          width:50px;
          text-align:center;
        ">
          כמות
        </span>

      </div>


      <!-- נתוני טילי היירוט -->

      ${interceptorRows}

    </div>
  `;
}

export function mountBlueLayer(
  group: LayerGroup,
  _map: LeafletMap,
): void {

  const blueIcon = L.icon({
    iconUrl: "/icons/blue-marker.svg",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  launchers.forEach((launcher) => {

    L.marker(
      [
        launcher.location.lat,
        launcher.location.long,
      ],
      {
        icon: blueIcon,
      },
    )
      .bindPopup(
        createLauncherPopup(launcher),
        {
          className:
            "blue-launcher-popup",
          closeButton: true,
          maxWidth: 280,
          minWidth: 280,
        },
      )
      .addTo(group);

  });


  // Remove Leaflet's default white popup background

  const styleId =
    "blue-launcher-popup-styles";

  if (!document.getElementById(styleId)) {

    const style =
      document.createElement("style");

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
}