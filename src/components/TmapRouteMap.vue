<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  routeData: { type: Object, default: null }
})

const emit = defineEmits(['error'])
const mapElement = ref(null)

let map = null
let infoWindow = null
let overlays = []
let renderVersion = 0

function loadTmapSdk() {
  if (window.Tmapv2) return Promise.resolve(window.Tmapv2)
  return Promise.reject(
    new Error('Tmap SDK가 로드되지 않았습니다. index.html의 VITE_TMAP_APP_KEY 설정을 확인해 주세요.')
  )
}

function clearOverlays() {
  overlays.forEach((overlay) => overlay.setMap?.(null))
  overlays = []
  infoWindow?.setMap?.(null)
}

function markerColor(pointType) {
  if (pointType === 'S') return '#21a366'
  if (pointType === 'E') return '#e74c3c'
  return '#168ac7'
}

function pointTypeOf(feature, index, total) {
  const type = String(feature.properties?.pointType || feature.properties?.type || '').toUpperCase()
  if (['S', 'B', 'E'].includes(type)) return type
  if (index === 0) return 'S'
  if (index === total - 1) return 'E'
  return 'B'
}

function addMarkerClickListener(Tmapv2, marker, handler) {
  if (typeof marker.addListener === 'function') {
    marker.addListener('click', handler)
  } else {
    Tmapv2.event?.addListener?.(marker, 'click', handler)
  }
}

function renderRoute(Tmapv2, routeData) {
  const features = routeData?.routeGeoJson?.features
  if (!Array.isArray(features) || !features.length) {
    throw new Error('경로 데이터(routeGeoJson)가 없습니다.')
  }

  const pointFeatures = features.filter((feature) => feature.geometry?.type === 'Point')
  const lineFeatures = features.filter((feature) => feature.geometry?.type === 'LineString')
  if (!pointFeatures.length) {
    throw new Error('지도에 표시할 경유지가 없습니다.')
  }

  clearOverlays()

  const [longitude, latitude] = pointFeatures[0].geometry.coordinates
  if (!map) {
    map = new Tmapv2.Map(mapElement.value, {
      center: new Tmapv2.LatLng(latitude, longitude),
      width: '100%',
      height: '600px'
    })
  }

  infoWindow ??= new Tmapv2.InfoWindow({ content: '', type: 2, map: null })
  const bounds = new Tmapv2.LatLngBounds()

  pointFeatures.forEach((feature, index) => {
    const [pointLongitude, pointLatitude] = feature.geometry.coordinates
    const position = new Tmapv2.LatLng(pointLatitude, pointLongitude)
    const pointType = pointTypeOf(feature, index, pointFeatures.length)
    const name = feature.properties?.name || feature.properties?.title || `${index + 1}번째 방문 장소`
    const marker = new Tmapv2.Marker({
      position,
      map,
      label: `${pointType} ${index + 1}`,
      icon: `https://tmapapi.sktelecom.com/upload/tmap/marker/pin-r-m-${pointType === 'S' ? 'g' : pointType === 'E' ? 'r' : 'b'}.png`,
      iconSize: new Tmapv2.Size(24, 38)
    })

    addMarkerClickListener(Tmapv2, marker, () => {
      infoWindow.setPosition(position)
      infoWindow.setContent(`<div style="padding:7px 10px;font-weight:700;color:${markerColor(pointType)}">${name}</div>`)
      infoWindow.setMap(map)
    })
    overlays.push(marker)
    bounds.extend(position)
  })

  lineFeatures.forEach((feature) => {
    const path = feature.geometry.coordinates
      .map(([lineLongitude, lineLatitude]) => new Tmapv2.LatLng(lineLatitude, lineLongitude))
    if (path.length < 2) return

    const polyline = new Tmapv2.Polyline({
      path,
      strokeColor: '#168ac7',
      strokeWeight: 6,
      map
    })
    overlays.push(polyline)
  })

  map.fitBounds(bounds)
}

async function drawRoute() {
  const version = ++renderVersion
  const routeData = props.routeData

  if (!routeData) {
    clearOverlays()
    return
  }

  // A template ref is assigned only after the component has rendered.
  await nextTick()
  if (version !== renderVersion || !mapElement.value) return

  try {
    const Tmapv2 = await loadTmapSdk()
    // Ignore an older async SDK request when newer route data has arrived.
    if (version !== renderVersion || !mapElement.value) return
    renderRoute(Tmapv2, routeData)
  } catch (error) {
    if (version !== renderVersion) return
    console.error('[TmapRouteMap] Failed to render map.', error)
    emit('error', error instanceof Error ? error.message : '지도를 표시하지 못했습니다.')
  }
}

// Watches both prerequisites: route data and the DOM template ref.
watch([() => props.routeData, mapElement], drawRoute, { flush: 'post' })

// Covers the case where routeData already exists during the first mount.
onMounted(drawRoute)

onBeforeUnmount(() => {
  renderVersion += 1
  clearOverlays()
  map = null
  infoWindow = null
})
</script>

<template>
  <div ref="mapElement" class="tmap-route-map" aria-label="추천 여행 경로 지도"></div>
</template>

<style scoped>
.tmap-route-map {
  min-height: 600px;
  border-radius: 24px;
  overflow: hidden;
  background: #edf8ff;
}
</style>
