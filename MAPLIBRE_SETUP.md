# MapLibre GL Setup Guide (Recommended - FREE & Feature-Rich)

## Why MapLibre?

✅ **100% FREE** - No API key needed  
✅ **Open Source** - No usage limits  
✅ **Mapbox-Compatible** - Easy migration from Mapbox  
✅ **Vector Tiles** - Fast, smooth rendering  
✅ **Custom Styling** - Beautiful maps  
✅ **3D Support** - Modern features  
✅ **Great Performance** - Optimized for web  

---

## Installation

### 1. Install Dependencies

```bash
npm install maplibre-gl react-map-gl
npm install --save-dev @types/maplibre-gl
```

### 2. Environment Variables

Add to your `.env` file:
```env
NEXT_PUBLIC_MAP_LIBRARY=maplibre
```

**For Vercel Deployment:**
- Go to Vercel Dashboard → Settings → Environment Variables
- Add: `NEXT_PUBLIC_MAP_LIBRARY` = `maplibre`
- Redeploy

---

## Basic Usage Example

### React Component

```jsx
'use client'
import { useState } from 'react'
import Map from 'react-map-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export default function LocationMap({ latitude, longitude }) {
  const [viewState, setViewState] = useState({
    longitude: longitude || -122.4,
    latitude: latitude || 37.8,
    zoom: 13
  })

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="https://demotiles.maplibre.org/style.json"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
```

---

## Advanced Features

### 1. Custom Map Style

```jsx
// Use different map styles
mapStyle="https://demotiles.maplibre.org/style.json"  // Default
// Or use OpenStreetMap style:
mapStyle="https://tiles.openfreemap.org/styles/liberty"
```

### 2. Add Markers

```jsx
import { Marker } from 'react-map-gl'

<Map {...viewState} mapStyle="...">
  <Marker longitude={lng} latitude={lat} anchor="bottom">
    <div style={{ 
      background: 'red', 
      width: '20px', 
      height: '20px', 
      borderRadius: '50%' 
    }} />
  </Marker>
</Map>
```

### 3. Real-time Location Tracking

```jsx
import { useState, useEffect } from 'react'
import Map, { Marker } from 'react-map-gl'

export default function LiveLocationMap({ userId }) {
  const [location, setLocation] = useState({ lat: 0, lng: 0 })

  useEffect(() => {
    // Fetch location from your API
    const fetchLocation = async () => {
      const res = await fetch(`/api/location/${userId}`)
      const data = await res.json()
      setLocation({ lat: data.lat, lng: data.lng })
    }
    
    fetchLocation()
    const interval = setInterval(fetchLocation, 5000) // Update every 5s
    return () => clearInterval(interval)
  }, [userId])

  return (
    <Map
      longitude={location.lng}
      latitude={location.lat}
      zoom={15}
      mapStyle="https://demotiles.maplibre.org/style.json"
      style={{ width: '100%', height: '100vh' }}
    >
      <Marker longitude={location.lng} latitude={location.lat}>
        <div style={{ 
          background: '#ff0000', 
          width: '24px', 
          height: '24px', 
          borderRadius: '50%',
          border: '3px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }} />
      </Marker>
    </Map>
  )
}
```

### 4. Multiple Markers (Parent-Child Locations)

```jsx
import Map, { Marker } from 'react-map-gl'

export default function MultiLocationMap({ locations }) {
  return (
    <Map
      longitude={locations[0]?.lng || 0}
      latitude={locations[0]?.lat || 0}
      zoom={12}
      mapStyle="https://demotiles.maplibre.org/style.json"
      style={{ width: '100%', height: '100vh' }}
    >
      {locations.map((loc, index) => (
        <Marker 
          key={index}
          longitude={loc.lng} 
          latitude={loc.lat}
        >
          <div style={{ 
            background: loc.role === 'parent' ? '#0066ff' : '#ff6600',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: '2px solid white'
          }} />
        </Marker>
      ))}
    </Map>
  )
}
```

---

## Map Styles (Free Options)

### 1. Default MapLibre Style
```jsx
mapStyle="https://demotiles.maplibre.org/style.json"
```

### 2. OpenStreetMap Style
```jsx
mapStyle="https://tiles.openfreemap.org/styles/liberty"
```

### 3. Dark Theme
```jsx
mapStyle="https://demotiles.maplibre.org/style.json" // Can be customized
```

---

## Next.js Setup

### 1. Add to `next.config.js` (if needed)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'mapbox-gl': 'maplibre-gl'
    }
    return config
  }
}

module.exports = nextConfig
```

### 2. Import CSS in your layout or page

```jsx
import 'maplibre-gl/dist/maplibre-gl.css'
```

---

## Features Comparison

| Feature | MapLibre | Leaflet | Mapbox |
|---------|----------|---------|--------|
| **Cost** | ✅ Free | ✅ Free | ❌ Paid |
| **API Key** | ✅ Not needed | ✅ Not needed | ❌ Required |
| **Vector Tiles** | ✅ Yes | ❌ No | ✅ Yes |
| **3D Support** | ✅ Yes | ❌ No | ✅ Yes |
| **Custom Styling** | ✅ Advanced | ⚠️ Basic | ✅ Advanced |
| **Performance** | ✅ Excellent | ⚠️ Good | ✅ Excellent |
| **Bundle Size** | Medium | Small | Large |

---

## Migration from Mapbox

If you were using Mapbox, MapLibre is a drop-in replacement:

```jsx
// Before (Mapbox)
import Map from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// After (MapLibre) - Same code!
import Map from 'react-map-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// Just change the mapStyle URL
```

---

## Resources

- **MapLibre Docs**: https://maplibre.org/
- **react-map-gl Docs**: https://visgl.github.io/react-map-gl/
- **Examples**: https://maplibre.org/maplibre-gl-js-docs/example/

---

## Quick Start Checklist

- [ ] Install: `npm install maplibre-gl react-map-gl`
- [ ] Add CSS: `import 'maplibre-gl/dist/maplibre-gl.css'`
- [ ] Set env: `NEXT_PUBLIC_MAP_LIBRARY=maplibre`
- [ ] Use Map component (see examples above)
- [ ] Deploy to Vercel with env variable

That's it! You now have a free, feature-rich map solution! 🗺️

