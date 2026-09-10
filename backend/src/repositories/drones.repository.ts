/**
 * @team     alerts
 * @owner    alerts-lead
 * @public   no
 * @updated  2026-09-10
 */
import { dataSource } from "../db/data-source";
import type { CurrentDrone } from "../db/entities/drone.entity";

type CurrentDroneRow = {
    id: string | number;
    heading: number;
    velocity: number;
    longitude: number;
    latitude: number;
    asl: number;
    agl: number;
};

export async function findCurrentDrones(): Promise<CurrentDrone[]> {
    const rows = await dataSource.query<CurrentDroneRow[]>(`
        SELECT
            d.id,
            d.heading,
            d.velocity,
            p.longitude,
            p.latitude,
            p.asl,
            p.agl
        FROM hatzot.drone AS d
        JOIN LATERAL (
            SELECT longitude, latitude, asl, agl
            FROM hatzot.drone_position
            WHERE drone_id = d.id
            ORDER BY recorded_at DESC, id DESC
            LIMIT 1
        ) AS p ON true
        WHERE d.heading IS NOT NULL
          AND d.velocity IS NOT NULL
          AND p.longitude IS NOT NULL
          AND p.latitude IS NOT NULL
    `);

    return rows.map((row) => ({
        id: Number(row.id),
        heading: row.heading,
        velocity: row.velocity,
        location: {
            longitude: row.longitude,
            latitude: row.latitude,
            asl: row.asl,
            agl: row.agl,
        },
    }));
}
