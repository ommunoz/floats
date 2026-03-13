<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useRouter } from 'vue-router'
import type { Tab } from '../stores/tabs'

const props = defineProps<{
  tabs: Tab[]
}>()

const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
const markers = ref<L.Marker[]>([])
const router = useRouter()

// Navigation helper for popups
;(window as any).navigateToTab = (id: string) => {
  router.push(`/tab/${id}`)
}

// Custom marker icon function
const createCustomIcon = (status: 'open' | 'low' | 'empty') => {
  const color = status === 'open' ? 'var(--floats-teal)' : status === 'low' ? 'var(--floats-amber)' : 'var(--muted-foreground)'
  
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 0.5rem; height: 0.5rem; background: white; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  })
}

const initMap = () => {
  if (!mapContainer.value) return

  // Center on NYC (Chelsea/West Village area)
  map = L.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: false
  }).setView([40.7306, -73.9866], 13)

  // Use a clean, minimal tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map)

  renderMarkers()
}

const renderMarkers = () => {
  if (!map) return

  // Clear existing markers
  markers.value.forEach(m => m.remove())
  markers.value = []

  // Add new markers
  props.tabs.forEach(tab => {
    // Some tabs might not have lat/lng yet if we missed any, handle gracefully
    const lat = (tab as any).lat
    const lng = (tab as any).lng
    
    if (lat && lng) {
      const marker = L.marker([lat, lng], {
        icon: createCustomIcon(tab.healthStatus)
      }).addTo(map!)

      // Generate Avatar Stack HTML
      const seeds = tab.claimerAddresses && tab.claimerAddresses.length > 0 
        ? tab.claimerAddresses.slice(0, 3) 
        : Array.from({ length: Math.min(tab.floatsGrabbed, 3) }).map((_, i) => `${tab.id}-${i}`)
      
      // Generate Avatar Stack HTML (size matching sm BaseAvatar: 1.75rem)
      const avatarsHtml = seeds.map((seed, i) => `
        <div class="popup-avatar" style="left: ${i * 1.25}rem; z-index: ${10 - i};">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}" />
        </div>
      `).join('')

      const statusLabels = {
        open: 'Tab open',
        low: 'Tab running low',
        empty: 'Tab empty'
      }

      // Custom Popup Content
      const popupContent = `
        <div class="map-popup-card">
          <div class="popup-cover">
            <img src="${tab.coverImage}" class="cover-img" />
          </div>
          <div class="logo-overlap">
            <img src="${tab.merchantLogo}" class="popup-logo" />
          </div>
          <div class="popup-body">
            <div class="popup-status-pill status--${tab.healthStatus}">
              <span class="status-dot"></span>
              ${statusLabels[tab.healthStatus]}
            </div>
            
            <div class="popup-info">
              <div class="popup-name">${tab.merchantName}</div>
              <div class="location-row">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="location-icon"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <div class="popup-address">${tab.address}</div>
              </div>
            </div>

            ${tab.floatsGrabbed > 0 ? `
              <div class="popup-social">
                <div class="popup-avatar-stack">
                  ${avatarsHtml}
                </div>
                <div class="social-spacer"></div>
                <span class="popup-social-text">${tab.floatsGrabbed} floats grabbed</span>
              </div>
            ` : ''}

            <div class="popup-actions">
              <button class="popup-link" onclick="window.navigateToTab('${tab.id}')">
                View Tab
              </button>
            </div>
          </div>
        </div>
      `

      marker.bindPopup(popupContent, {
        maxWidth: 280,
        className: 'custom-merchant-popup'
      })

      // Optional: Add a simple tooltip on hover
      marker.bindTooltip(tab.merchantName, {
        direction: 'top',
        offset: [0, -10],
        className: 'marker-tooltip'
      })

      markers.value.push(marker)
    }
  })

  // Fit bounds if we have markers
  if (markers.value.length > 0) {
    const group = L.featureGroup(markers.value as unknown as L.Layer[])
    map.fitBounds(group.getBounds().pad(0.2))
  }
}

watch(() => props.tabs, renderMarkers, { deep: true })

onMounted(() => {
  // Small delay to ensure container is properly sized
  setTimeout(initMap, 100)
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div class="map-wrapper">
    <div ref="mapContainer" class="map-container"></div>
    
    <!-- Legend -->
    <div class="map-legend">
      <div class="legend-item">
        <span class="dot dot-open"></span>
        <span>Open</span>
      </div>
      <div class="legend-item">
        <span class="dot dot-low"></span>
        <span>Running Low</span>
      </div>
      <div class="legend-item">
        <span class="dot dot-empty"></span>
        <span>Empty</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.map-wrapper {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0; // Fixes flex child overflow
  border-radius: 1.25rem;
  overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}

.map-container {
  width: 100%;
  height: 100%;
  z-index: 1;
}

.map-legend {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  z-index: 2;
  background: white;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--border);

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    
    &.dot-open { background: var(--floats-teal); }
    &.dot-low { background: var(--floats-amber); }
    &.dot-empty { background: var(--muted-foreground); }
  }
}

.marker-tooltip {
  background: var(--card) !important;
  border: 1px solid var(--border) !important;
  border-radius: 0.5rem !important;
  color: var(--foreground) !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
}

// Clean up Leaflet default focus outline
.leaflet-container :focus {
  outline: none;
}

// Global styles for Leaflet Popups (targeting the custom class we set)
.custom-merchant-popup {
  .leaflet-popup-content-wrapper {
    padding: 0;
    overflow: visible !important; // Allow logo to overlap
    border-radius: 1rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    background: white;
  }

  .leaflet-popup-content {
    margin: 0;
    width: 280px !important; // Match maxWidth
    overflow: visible !important;
  }

  .leaflet-popup-tip {
    background: white;
  }

  .leaflet-popup-close-button {
    color: white !important;
    z-index: 100;
    font-size: 16px !important;
    padding: 6px !important;
    background: rgba(0,0,0,0.3) !important;
    border-radius: 50%;
    top: 8px !important;
    right: 8px !important;
    width: 24px !important;
    height: 24px !important;
    display: flex !important;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255,255,255,0.2) !important;
    transition: background 0.2s;

    &:hover { background: rgba(0,0,0,0.5) !important; }
  }

  .map-popup-card {
    display: flex;
    flex-direction: column;
    overflow: visible;
    position: relative;

    .popup-cover {
      position: relative;
      height: 110px;
      border-radius: 1rem 1rem 0 0;
      overflow: hidden;

      .cover-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .logo-overlap {
      position: absolute;
      top: 85px; // Overlaps cover
      left: 1rem;
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      background: white;
      padding: 0.2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 20;

      .popup-logo {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }
    }

    .popup-body {
      padding: 1.25rem 1rem 1rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      background: white;
      border-radius: 0 0 1rem 1rem;

      .popup-status-pill {
        align-self: flex-end;
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        width: max-content;
        padding: 0.2rem 0.6rem;
        border-radius: 9999px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: none;
        letter-spacing: normal;
        margin-top: -0.25rem;

        .status-dot {
          width: 0.375rem;
          height: 0.375rem;
          border-radius: 9999px;
        }

        &.status--open { 
          background: rgba(20, 184, 166, 0.1); 
          color: var(--floats-teal); 
          .status-dot { background: var(--floats-teal); }
        }
        &.status--low { 
          background: rgba(249, 115, 22, 0.1); 
          color: var(--floats-orange); 
          .status-dot { background: var(--floats-orange); }
        }
        &.status--empty { 
          background: #f1f5f9; 
          color: #64748b; 
          .status-dot { background: #94A3B8; }
        }
      }

      .popup-info {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        margin-top: -0.25rem;

        .popup-name {
          font-weight: 700;
          font-size: 1.0625rem;
          color: var(--floats-navy);
          line-height: 1.2;
        }

        .location-row {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-top: 0.1rem;

          .location-icon {
            flex-shrink: 0;
            color: var(--muted-foreground);
            opacity: 0.7;
          }

          .popup-address {
            font-size: 0.75rem;
            color: var(--muted-foreground);
            font-weight: 500;
          }
        }
      }

      .popup-social {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 0.25rem;

        .popup-avatar-stack {
          position: relative;
          height: 1.75rem;
          width: 4rem;
        }

        .popup-avatar {
          position: absolute;
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 50%;
          border: 2px solid white;
          overflow: hidden;
          background: #f1f5f9;

          img { width: 100%; height: 100%; object-fit: cover; }
        }

        .social-spacer {
          flex: 1;
        }

        .popup-social-text {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--muted-foreground);
        }
      }

      .popup-actions {
        margin-top: 0.25rem;
        .popup-link {
          width: 100%;
          height: 2.75rem;
          border-radius: 0.75rem;
          background: var(--floats-teal);
          color: white;
          border: none;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s, background-color 0.2s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(20, 184, 166, 0.2);

          &:hover { 
            background: #0d9488;
            transform: translateY(-1px);
            box-shadow: 0 6px 12px -2px rgba(20, 184, 166, 0.3);
          }
          
          &:active { transform: translateY(0); }
        }
      }
    }
  }
}
</style>
