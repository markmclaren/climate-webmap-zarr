# Climate Webmap Zarr

This is an interactive 2D Map and 3D Globe web application demonstrating cloud-native climate data visualization.

It recreates and adapts parts of:
- [CarbonPlan Maps](https://github.com/carbonplan/maps) ([Demo](https://maps.demo.carbonplan.org/))

## Features
- **Interactive Visualization**: Toggle between average temperature (`tavg`) and precipitation (`precip`) variables.
- **Temporal Control**: Interactive slider to animate or select data across the 12 months.
- **Multiscale Rendering**: Efficient rendering of 6 resolution levels based on map zoom using web tiles.
- **2D/3D Views**: Navigation buttons to switch between a flat 2D Map (`index.html`) and a 3D Globe Projection (`globe.html`).

## Tech Stack
- **Map Engine**: [MapLibre GL](https://maplibre.org/)
- **Data Layers**: [@carbonplan/zarr-layer](https://github.com/carbonplan/zarr-layer)
- **Colormaps**: [@carbonplan/colormaps](https://github.com/carbonplan/colormaps)
- **Base Map**: Dark tiles from [OpenFreeMap](https://openfreemap.org/)

## Data Source
The application streams Zarr multiscale data directly from HuggingFace without a backend database:
- **HuggingFace Dataset**: [markmclaren/climate-webmap-zarr](https://huggingface.co/datasets/markmclaren/climate-webmap-zarr)

## Structure
- `index.html`: 2D Map view
- `globe.html`: 3D Globe view
- `style.css`: Unified CSS styles
- `map.js`: Shared MapLibre GL controller logic