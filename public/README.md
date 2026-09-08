# public/

Static assets served as-is.

- Raster basemap tiles for the air-gapped build — either a static `{z}/{x}/{y}`
  tile directory or a raster `.pmtiles` archive read through `protomaps-leaflet`.
  (Hebrew place names are baked into the tiles; Leaflet needs no RTL text plugin.)

Added at deploy time; not committed to the skeleton.
