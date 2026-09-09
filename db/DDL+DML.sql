-- =====================================================================
-- Drone / Anti-Drone Defense System Schema
-- PostgreSQL DDL + sample DML
-- Idempotent: safe to run repeatedly, always yields the same end state.
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
    CONSTRAINT uk_drone_type_name UNIQUE (name)
);

-- ---------------------------------------------------------------------
-- DRONE
-- ---------------------------------------------------------------------
CREATE TABLE hatzot.drone (
    id              bigint    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
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
    CONSTRAINT uk_launcher_type_name UNIQUE (name)
);

-- ---------------------------------------------------------------------
-- DEPLOYMENT
-- ---------------------------------------------------------------------
CREATE TABLE hatzot.deployment (
    id      serial  PRIMARY KEY,
    name    text    NOT NULL
);

-- ---------------------------------------------------------------------
-- LIVE_LAUNCHER
-- ---------------------------------------------------------------------
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

COMMIT;

-- =====================================================================
-- DML - sample seed data
-- Tables were just (re)created empty above, so plain INSERTs here are
-- also idempotent: every run starts from a clean slate and ends with
-- exactly this data, nothing more.
-- =====================================================================

BEGIN;

-- Drone types
INSERT INTO hatzot.drone_type (name) VALUES
    ('SkyMite C7'),
    ('NanoSwarm-Q9'),
    ('LoadBee M2'),
    ('Falcon Long X4');

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
INSERT INTO hatzot.launcher_type (name, reload_time_s) VALUES
    ('Fixed Site SAM', 8.5),
    ('Mobile Gun System', 3.2),
    ('Directed Energy', 0.5);

-- Deployments
INSERT INTO hatzot.deployment (name) VALUES
    ('Northern Sector'),
    ('Coastal Sector');

-- Live launchers
INSERT INTO hatzot.live_launcher (launcher_type_id, deployment_id, longitude, latitude, asl, agl, amount, active) VALUES
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'Fixed Site SAM'),
        (SELECT id FROM hatzot.deployment WHERE name = 'Northern Sector'), 34.7900, 32.0900, 50.0, 0.0, 8, true),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'Mobile Gun System'),
        (SELECT id FROM hatzot.deployment WHERE name = 'Coastal Sector'), 34.7700, 32.0600, 20.0, 0.0, 4, true),
    ((SELECT id FROM hatzot.launcher_type WHERE name = 'Directed Energy'),
        (SELECT id FROM hatzot.deployment WHERE name = 'Northern Sector'), 34.8100, 32.1100, 15.0, 0.0, 1, false);

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

COMMIT;