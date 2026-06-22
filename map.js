import { ZarrLayer } from '@carbonplan/zarr-layer'
import { makeColormap } from '@carbonplan/colormaps'

/* ── Determine View (2D Map vs 3D Globe) ── */
const isGlobe = window.location.pathname.includes('globe');

/* ── Color scales ── */

const TEMP_COLORMAP = makeColormap('warm', { count: 7, mode: 'dark', format: 'hex' })
const PREC_COLORMAP = makeColormap('cool', { count: 7, mode: 'dark', format: 'hex' })
const TEMP_CLIM = [-20, 30]
const PREC_CLIM = [0, 300]

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const STORE_URL =
  'https://huggingface.co/datasets/markmclaren/climate-webmap-zarr/resolve/main/tavg-prec-month-topozarr.zarr'

/* ── Map ── */

const mapOptions = {
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/dark',
  center: [0, 30],
  zoom: isGlobe ? 2.5 : 2,
  minZoom: isGlobe ? 0 : 2,
  maxZoom: 5,
  attributionControl: !isGlobe,
}

if (!isGlobe) {
  mapOptions.renderWorldCopies = false
} else {
  mapOptions.bearing = 0
}

const map = new maplibregl.Map(mapOptions)

if (isGlobe) {
  map.on('style.load', () => {
    map.setProjection({
      type: 'globe', // Set projection to globe
    })
  })
}

/* ── Disable labels ── */

function hideLabels() {
  const style = map.getStyle()
  if (!style || !style.layers) return
  for (const layer of style.layers) {
    if (layer.type === 'symbol') {
      map.setLayoutProperty(layer.id, 'visibility', 'none')
    }
  }
}

map.on('style.load', hideLabels)
map.on('data', (e) => {
  if (e.dataType === 'style') hideLabels()
})

/* ── Zarr layer ── */

let layer = new ZarrLayer({
  id: 'climate',
  source: STORE_URL,
  variable: 'tavg',
  colormap: TEMP_COLORMAP,
  clim: TEMP_CLIM,
  selector: { month: { selected: 0, type: 'index' } },
  zarrVersion: 3,
  bounds: [-180, -90, 180, 90],
  latIsAscending: false,
})

map.on('load', () => {
  map.addLayer(layer)

  map.addLayer({
    id: 'ocean-mask-fill',
    type: 'fill',
    source: 'openmaptiles',
    'source-layer': 'water',
    paint: {
      'fill-color': '#17202e',
      'fill-opacity': 1.0
    }
  })

  map.addLayer({
    id: 'ocean-mask-outline',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'water',
    paint: {
      'line-color': '#444444',
      'line-width': 1,
      'line-opacity': 0.7
    }
  })
})

/* ── UI state & DOM refs ── */

let currentVar = 'tavg'
let currentMonth = 0

const monthSlider = document.getElementById('month-slider')
const monthLabel  = document.getElementById('month-label')
const btnTavg     = document.getElementById('btn-tavg')
const btnPrec     = document.getElementById('btn-prec')
const legendBar   = document.getElementById('legend-bar')
const legendMin   = document.getElementById('legend-min')
const legendMax   = document.getElementById('legend-max')
const panel = document.getElementById('panel')
const panelToggle = document.querySelector('.panel-toggle')

/* ── Legend ── */

function updateLegend(colormap, clim, unit) {
  const stops = colormap.length
  const segments = colormap
    .map((c, i) => `${c} ${(i / (stops - 1)) * 100}%`)
    .join(', ')
  legendBar.style.background = `linear-gradient(to right, ${segments})`
  legendMin.textContent = String(clim[0])
  legendMax.textContent = `${clim[1]} ${unit}`
}

/* ── Layer update (debounced) ── */

let debounceTimer

function updateLayer() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    layer.setSelector({ month: { selected: currentMonth, type: 'index' } })
  }, 40)
}

/* ── Variable toggle ── */

function setVariable(variable) {
  currentVar = variable
  btnTavg.classList.toggle('active', variable === 'tavg')
  btnPrec.classList.toggle('active', variable === 'prec')

  // Remove old layer to avoid buggy setVariable behavior in zarr-layer
  if (map.getLayer('climate')) {
    map.removeLayer('climate')
  }

  const colormap = variable === 'tavg' ? TEMP_COLORMAP : PREC_COLORMAP
  const clim = variable === 'tavg' ? TEMP_CLIM : PREC_CLIM
  const unit = variable === 'tavg' ? '°C' : 'mm'

  updateLegend(colormap, clim, unit)

  layer = new ZarrLayer({
    id: 'climate',
    source: STORE_URL,
    variable: variable,
    colormap: colormap,
    clim: clim,
    selector: { month: { selected: currentMonth, type: 'index' } },
    zarrVersion: 3,
    bounds: [-180, -90, 180, 90],
    latIsAscending: false,
  })

  // Add the new layer before ocean mask layers if they exist to keep correct layering
  if (map.getLayer('ocean-mask-fill')) {
    map.addLayer(layer, 'ocean-mask-fill')
  } else {
    map.addLayer(layer)
  }
}

btnTavg.addEventListener('click', () => setVariable('tavg'))
btnPrec.addEventListener('click', () => setVariable('prec'))

/* ── Month slider ── */

monthSlider.addEventListener('input', () => {
  const idx = parseInt(monthSlider.value, 10)
  monthLabel.textContent = MONTH_NAMES[idx]
  currentMonth = idx
  updateLayer()
})

/* ── Panel toggle ── */

panelToggle.addEventListener('click', () => {
  panel.classList.toggle('collapsed')
})

/* ── Initial legend ── */

updateLegend(TEMP_COLORMAP, TEMP_CLIM, '°C')
