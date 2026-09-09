-- =====================================================================
-- Drone / Anti-Drone Defense System Schema  (v2)
-- PostgreSQL DDL + sample DML
-- Idempotent: safe to run repeatedly, always yields the same end state.
--
-- CHANGES IN v2 (integrating the new INTERCEPTION entity from the ERD):
--   * hatzot.drone_type          + price column
--   * hatzot.live_launcher       + range, status columns (new launcher_status enum)
--   * NEW hatzot.interception    the launch of one interceptor at one drone,
--                                 fired FROM a stocked (launcher, interceptor_type)
--                                 pair in launcher_ammunition, and targeted AT a drone.
--   * NEW enums: hatzot.launcher_status, hatzot.interception_status,
--                hatzot.interception_result
-- =====================================================================

BEGIN;

-- =====================================================================
-- SCHEMA
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS hatzot;

-- =====================================================================
-- DDL - drop existing objects first (reverse dependency order) so the
-- script can be re-run and always produce the same schema/data.
-- CASCADE also removes dependent indexes/constraints automatically.
-- =====================================================================

DROP TYPE IF EXISTS hatzot.deployment_status CASCADE;
DROP TYPE IF EXISTS hatzot.launcher_status CASCADE;
DROP TYPE IF EXISTS hatzot.interception_status CASCADE;
DROP TYPE IF EXISTS hatzot.interception_result CASCADE;

DROP TABLE IF EXISTS hatzot.interception CASCADE;
DROP TABLE IF EXISTS hatzot.launcher_ammunition CASCADE;
DROP TABLE IF EXISTS hatzot.interceptor_type CASCADE;
DROP TABLE IF EXISTS hatzot.live_launcher CASCADE;
DROP TABLE IF EXISTS hatzot.deployment CASCADE;
DROP TABLE IF EXISTS hatzot.launcher_type CASCADE;
DROP TABLE IF EXISTS hatzot.drone_position CASCADE;
DROP TABLE IF EXISTS hatzot.drone CASCADE;
DROP TABLE IF EXISTS hatzot.drone_type CASCADE;

-- ---------------------------------------------------------------------
-- DRONE_TYPE
-- ---------------------------------------------------------------------
CREATE TABLE hatzot.drone_type (
    id      smallint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name    text          NOT NULL,
    price   integer,
    CONSTRAINT uk_drone_type_name UNIQUE (name)
);

-- ---------------------------------------------------------------------
-- DRONE
-- ---------------------------------------------------------------------
CREATE TABLE hatzot.drone (
    id              uuid   GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    drone_type_id   smallint  NOT NULL,
    heading         double precision,
    velocity        double precision,
    CONSTRAINT fk_drone_drone_type
        FOREIGN KEY (drone_type_id) REFERENCES hatzot.drone_type (id)
);

CREATE INDEX idx_drone_drone_type_id ON hatzot.drone (drone_type_id);

-- ---------------------------------------------------------------------
-- DRONE_POSITION  (tracked by)
-- ---------------------------------------------------------------------
CREATE TABLE hatzot.drone_position (
    id              bigint          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    drone_id        bigint          NOT NULL,
    longitude       double precision,
    latitude        double precision,
    asl             double precision,
    agl             double precision,
    recorded_at     timestamptz     NOT NULL DEFAULT now(),
    CONSTRAINT fk_drone_position_drone
        FOREIGN KEY (drone_id) REFERENCES hatzot.drone (id)
);

CREATE INDEX idx_drone_position_drone_id ON hatzot.drone_position (drone_id);
CREATE INDEX idx_drone_position_recorded_at ON hatzot.drone_position (recorded_at);

-- ---------------------------------------------------------------------
-- LAUNCHER_TYPE
-- ---------------------------------------------------------------------
CREATE TABLE hatzot.launcher_type (
    id              smallint    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            text        NOT NULL,
    reload_time_s   numeric,
    range_m         integer,
    CONSTRAINT uk_launcher_type_name UNIQUE (name)
);

-- ---------------------------------------------------------------------
-- DEPLOYMENT
-- ---------------------------------------------------------------------
CREATE TYPE hatzot.deployment_status AS ENUM ('Real', 'Saved', 'Draft');

CREATE TABLE hatzot.deployment (
    id      serial                   PRIMARY KEY,
    name    text                     NOT NULL,
    status  hatzot.deployment_status NOT NULL DEFAULT 'Draft'
);

-- ---------------------------------------------------------------------
-- LIVE_LAUNCHER
-- ---------------------------------------------------------------------
CREATE TYPE hatzot.launcher_status AS ENUM ('ACTIVE', 'SAVED', 'DRAFT');

CREATE TABLE hatzot.live_launcher (
    id                  bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    launcher_type_id    smallint    NOT NULL,
    deployment_id       smallint,
    longitude           double precision,
    latitude            double precision,
    asl                 double precision,
    agl                 double precision,
    amount              integer,
    active              boolean     NOT NULL DEFAULT true,
    range               integer,
    status              hatzot.launcher_status NOT NULL DEFAULT 'DRAFT',
    CONSTRAINT fk_live_launcher_launcher_type
        FOREIGN KEY (launcher_type_id) REFERENCES hatzot.launcher_type (id),
    CONSTRAINT fk_live_launcher_deployment
        FOREIGN KEY (deployment_id) REFERENCES hatzot.deployment (id)
);

CREATE INDEX idx_live_launcher_launcher_type_id ON hatzot.live_launcher (launcher_type_id);
CREATE INDEX idx_live_launcher_deployment_id ON hatzot.live_launcher (deployment_id);

-- ---------------------------------------------------------------------
-- INTERCEPTOR_TYPE
-- ---------------------------------------------------------------------
CREATE TABLE hatzot.interceptor_type (
    id                          smallint    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name                        text        NOT NULL,
    range_m                     integer,
    price                       integer,
    estimated_success_rate      jsonb,
    capacity                    smallint,
    CONSTRAINT uk_interceptor_type_name UNIQUE (name)
);

COMMENT ON COLUMN hatzot.interceptor_type.estimated_success_rate IS
    'Estimated interception success rate against each drone_type. Array of objects: [{"droneType": "Multirotor", "successRate": 0.92}, {"droneType": "Fixed Wing", "successRate": 0.75}]';

-- ---------------------------------------------------------------------
-- LAUNCHER_AMMUNITION  (stocks / loaded as)
-- ---------------------------------------------------------------------
CREATE TABLE hatzot.launcher_ammunition (
    launcher_id             bigint      NOT NULL,
    interceptor_type_id     smallint    NOT NULL,
    quantity                integer     NOT NULL DEFAULT 0,
    CONSTRAINT pk_launcher_ammunition
        PRIMARY KEY (launcher_id, interceptor_type_id),
    CONSTRAINT fk_launcher_ammunition_live_launcher
        FOREIGN KEY (launcher_id) REFERENCES hatzot.live_launcher (id),
    CONSTRAINT fk_launcher_ammunition_interceptor_type
        FOREIGN KEY (interceptor_type_id) REFERENCES hatzot.interceptor_type (id)
);

CREATE INDEX idx_launcher_ammunition_interceptor_type_id
    ON hatzot.launcher_ammunition (interceptor_type_id);

-- ---------------------------------------------------------------------
-- INTERCEPTION  (fired_from launcher_ammunition / targeted_in drone)
--
-- One interception = one interceptor of a given interceptor_type, fired
-- from one live_launcher, aimed at one drone.
--
-- Design note: (live_launcher_id, interceptor_type_id) is a COMPOSITE
-- foreign key into launcher_ammunition (its primary key), not two
-- independent FKs into live_launcher and interceptor_type. This mirrors
-- the "fired_from" relationship in the ERD, which originates at
-- LAUNCHER_AMMUNITION, and it lets the database itself guarantee that an
-- interception can only ever be logged against an interceptor type that
-- is actually stocked on that launcher.
-- ---------------------------------------------------------------------
CREATE TYPE hatzot.interception_status AS ENUM
    ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'ABORTED');

CREATE TYPE hatzot.interception_result AS ENUM ('HIT', 'MISS');

CREATE TABLE hatzot.interception (
    id                      bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    live_launcher_id        bigint      NOT NULL,
    interceptor_type_id     smallint    NOT NULL,
    drone_id                bigint      NOT NULL,
    launched_at             timestamptz NOT NULL DEFAULT now(),
    interceptor_longitude   double precision,
    interceptor_latitude    double precision,
    priority                smallint    NOT NULL DEFAULT 3,
    status                  hatzot.interception_status NOT NULL DEFAULT 'PENDING',
    result                  hatzot.interception_result,
    CONSTRAINT fk_interception_launcher_ammunition
        FOREIGN KEY (live_launcher_id, interceptor_type_id)
        REFERENCES hatzot.launcher_ammunition (launcher_id, interceptor_type_id),
    CONSTRAINT fk_interception_drone
        FOREIGN KEY (drone_id) REFERENCES hatzot.drone (id),
    CONSTRAINT chk_interception_priority
        CHECK (priority BETWEEN 1 AND 5),
    CONSTRAINT chk_interception_result_consistency
        CHECK (
            (status IN ('SUCCESS', 'FAILED') AND result IS NOT NULL)
            OR (status NOT IN ('SUCCESS', 'FAILED') AND result IS NULL)
        )
);

CREATE INDEX idx_interception_launcher_ammunition
    ON hatzot.interception (live_launcher_id, interceptor_type_id);
CREATE INDEX idx_interception_drone_id ON hatzot.interception (drone_id);
CREATE INDEX idx_interception_status ON hatzot.interception (status);
CREATE INDEX idx_interception_launched_at ON hatzot.interception (launched_at);

COMMENT ON COLUMN hatzot.interception.priority IS
    'Engagement priority, 1 (lowest) - 5 (highest/critical). Modeled as smallint + CHECK rather than a Postgres ENUM because the ERD defines it as a numeric scale.';
COMMENT ON CONSTRAINT chk_interception_result_consistency ON hatzot.interception IS
    'result is only recorded once the interception has resolved (SUCCESS/FAILED); it stays NULL while PENDING/IN_PROGRESS/ABORTED.';

COMMIT;

-- =====================================================================
-- DML - sample seed data
-- Tables were just (re)created empty above, so plain INSERTs here are
-- also idempotent: every run starts from a clean slate and ends with
-- exactly this data, nothing more.
-- =====================================================================

BEGIN;

-- Drone types
INSERT INTO hatzot.drone_type (name, price) VALUES
    ('SkyMite C7', 2500),
    ('NanoSwarm-Q9', 1800),
    ('LoadBee M2', 4200),
    ('Falcon Long X4', 6800);

-- Drones
INSERT INTO hatzot.drone (drone_type_id, heading, velocity) VALUES
    ((SELECT id FROM hatzot.drone_type WHERE name = 'SkyMite C7'), 45.0, 12.5),
    ((SELECT id FROM hatzot.drone_type WHERE name = 'NanoSwarm-Q9'), 270.0, 38.2),
    ((SELECT id FROM hatzot.drone_type WHERE name = 'LoadBee M2'), 90.0, 55.0);

-- Drone positions
INSERT INTO hatzot.drone_position (drone_id, longitude, latitude, asl, agl, recorded_at) VALUES
    (1, 34.7818, 32.0853, 150.0, 120.0, now() - interval '2 minutes'),
    (1, 34.7825, 32.0860, 152.0, 122.0, now() - interval '1 minute'),
    (2, 34.8000, 32.1000, 900.0, 850.0, now() - interval '30 seconds'),
    (3, 34.7500, 32.0700, 300.0, 280.0, now());

-- Launcher types
INSERT INTO hatzot.launcher_type (name, reload_time_s, range_m) VALUES
    ('ShieldNest-Lite', 45, 40000),
    ('IronHook-SR', 90, 60000),
    ('HorizonEye-MX', 30, 25000),
    ('CloudFence-Area', 120, 80000);

-- Deployments
INSERT INTO hatzot.deployment (name, status) VALUES
    ('Northern Sector', 'Real'),
    ('Coastal Sector', 'Saved');

-- Live launchers
INSERT INTO hatzot.live_launcher (launcher_type_id, deployment_id, longitude, latitude, asl, agl, amount, range, status) VALUES
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'ShieldNest-Lite'), 1, 35.2845, 33.0512, 480.0, 5.5, 8, 40000, 'ACTIVE'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'ShieldNest-Lite'), 1, 35.195, 32.8341, 210.0, 6.2, 8, 40000, 'ACTIVE'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'ShieldNest-Lite'), 2, 34.981, 32.482, 65.0, 4.8, 6, 40000, 'SAVED'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'ShieldNest-Lite'), 2, 34.8821, 32.0834, 45.0, 8.0, 6, 40000, 'SAVED'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'ShieldNest-Lite'), 2, 34.8412, 31.7825, 115.0, 5.0, 6, 40000, 'SAVED'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'ShieldNest-Lite'), 2, 34.612, 31.5432, 95.0, 4.5, 4, 40000, 'SAVED'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'ShieldNest-Lite'), 2, 34.7215, 31.334, 180.0, 7.1, 4, 40000, 'SAVED'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'ShieldNest-Lite'), 2, 34.895, 31.1215, 320.0, 5.2, 4, 40000, 'SAVED'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'IronHook-SR'), 1, 35.572, 33.185, 520.0, 8.5, 12, 60000, 'ACTIVE'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'IronHook-SR'), 1, 35.145, 32.712, 140.0, 10.0, 10, 60000, 'ACTIVE'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'IronHook-SR'), 2, 34.935, 32.221, 55.0, 9.2, 10, 60000, 'SAVED'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'IronHook-SR'), 2, 34.698, 31.685, 85.0, 6.8, 8, 60000, 'SAVED'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'IronHook-SR'), 2, 34.851, 31.425, 260.0, 11.4, 8, 60000, 'SAVED'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'IronHook-SR'), 2, 34.931, 30.985, 510.0, 7.5, 6, 60000, 'SAVED'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'HorizonEye-MX'), 1, 35.421, 32.981, 780.0, 12.0, 4, 25000, 'ACTIVE'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'HorizonEye-MX'), 1, 34.992, 32.355, 95.0, 14.5, 4, 25000, 'ACTIVE'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'HorizonEye-MX'), 2, 34.975, 31.852, 245.0, 11.0, 3, 25000, 'SAVED'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'HorizonEye-MX'), 2, 34.795, 31.258, 310.0, 13.2, 3, 25000, 'SAVED'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'CloudFence-Area'), 1, 35.591, 33.221, 620.0, 4.0, 16, 80000, 'ACTIVE'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'CloudFence-Area'), 1, 35.295, 32.915, 290.0, 3.5, 16, 80000, 'ACTIVE'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'CloudFence-Area'), 1, 35.289, 32.612, 110.0, 4.2, 14, 80000, 'ACTIVE'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'CloudFence-Area'), 2, 34.921, 32.435, 35.0, 5.0, 14, 80000, 'SAVED'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'CloudFence-Area'), 2, 34.852, 32.145, 40.0, 3.8, 12, 80000, 'SAVED'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'CloudFence-Area'), 2, 35.012, 31.892, 220.0, 4.6, 12, 80000, 'SAVED'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'CloudFence-Area'), 2, 34.582, 31.671, 50.0, 3.2, 10, 80000, 'SAVED'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'CloudFence-Area'), 2, 34.621, 31.485, 105.0, 4.0, 10, 80000, 'SAVED'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'CloudFence-Area'), 2, 35.205, 31.251, 580.0, 5.5, 8, 80000, 'SAVED'),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'CloudFence-Area'), 2, 34.805, 30.612, 860.0, 4.8, 8, 80000, 'SAVED');

-- Interceptor types
INSERT INTO hatzot.interceptor_type (name, range_m, price, estimated_success_rate, capacity) VALUES
    ('BuzzStop-15', 10000, 15000,
        '[
            {"droneType": "SkyMite C7", "successRate": 0.72},
            {"droneType": "NanoSwarm-Q9", "successRate": 0.38}
        ]'::jsonb, 24),
    ('NetWing-30', 10000, 22000,
        '[
            {"droneType": "SkyMite C7", "successRate": 0.81},
            {"droneType": "LoadBee M2", "successRate": 0.64}
        ]'::jsonb, 16),
    ('DartFox-S', 30000, 45000,
        '[
            {"droneType": "LoadBee M2", "successRate": 0.77},
            {"droneType": "SkyMite C7", "successRate": 0.69}
        ]'::jsonb, 15),
    ('SpearMini-70', 30000, 68000,
        '[
            {"droneType": "LoadBee M2", "successRate": 0.84},
            {"droneType": "Falcon Long X4", "successRate": 0.58}
        ]'::jsonb, 10),
    ('SkyLance-M', 50000, 120000,
        '[
            {"droneType": "Falcon Long X4", "successRate": 0.74}
        ]'::jsonb, 12),
    ('FalconClip-H', 70000, 180000,
        '[
            {"droneType": "Falcon Long X4", "successRate": 0.86},
            {"droneType": "LoadBee M2", "successRate": 0.73}
        ]'::jsonb, 6),
    ('SwarmMist-5', 5000, 7500,
        '[
            {"droneType": "NanoSwarm-Q9", "successRate": 0.55}
        ]'::jsonb, 45),
    ('MicroNet-R', 7000, 18000,
        '[
            {"droneType": "NanoSwarm-Q9", "successRate": 0.68},
            {"droneType": "SkyMite C7", "successRate": 0.73}
        ]'::jsonb, 15);

-- Launcher ammunition (stocks / loaded as)
INSERT INTO hatzot.launcher_ammunition (launcher_id, interceptor_type_id, quantity) VALUES
    (1, (SELECT id FROM hatzot.interceptor_type WHERE name = 'BuzzStop-15'), 6),
    (1, (SELECT id FROM hatzot.interceptor_type WHERE name = 'NetWing-30'), 2),
    (2, (SELECT id FROM hatzot.interceptor_type WHERE name = 'SwarmMist-5'), 500),
    (3, (SELECT id FROM hatzot.interceptor_type WHERE name = 'BuzzStop-15'), 0);

-- Interceptions (fired_from launcher_ammunition / targeted_in drone)
-- Every (live_launcher_id, interceptor_type_id) pair below MUST already
-- exist in launcher_ammunition - that's the composite FK in action.
INSERT INTO hatzot.interception
    (live_launcher_id, interceptor_type_id, drone_id, launched_at, interceptor_longitude, interceptor_latitude, priority, status, result) VALUES
    -- launcher 1 fires a BuzzStop-15 at drone 1 (SkyMite C7) -> hit
    (1, (SELECT id FROM hatzot.interceptor_type WHERE name = 'BuzzStop-15'), 1,
        now() - interval '2 minutes', 34.7820, 32.0855, 3, 'SUCCESS', 'HIT'),
    -- launcher 1 follows up with a NetWing-30 at the same drone -> miss
    (1, (SELECT id FROM hatzot.interceptor_type WHERE name = 'NetWing-30'), 1,
        now() - interval '90 seconds', 34.7823, 32.0858, 2, 'FAILED', 'MISS'),
    -- launcher 2 engages the swarm drone with SwarmMist-5 -> still in progress
    (2, (SELECT id FROM hatzot.interceptor_type WHERE name = 'SwarmMist-5'), 2,
        now() - interval '20 seconds', 34.7995, 32.0995, 5, 'IN_PROGRESS', NULL),
    -- launcher 3 has a BuzzStop-15 line loaded (currently empty stock) targeting drone 3 -> just queued
    (3, (SELECT id FROM hatzot.interceptor_type WHERE name = 'BuzzStop-15'), 3,
        now(), NULL, NULL, 1, 'PENDING', NULL);

COMMIT;
