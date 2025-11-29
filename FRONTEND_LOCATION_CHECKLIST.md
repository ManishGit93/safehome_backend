# Frontend Location Tracking Checklist

## 🔍 Problem: No Location Pings in Database

**Status:**
- ✅ Link Status: ACCEPTED
- ✅ Consent Given: true
- ✅ Socket.IO: Connected
- ❌ Location Pings: 0 (NOT BEING SENT)

## 📋 Frontend Must Do These Steps

### 1. ✅ Connect to Socket.IO

```typescript
import { io } from 'socket.io-client'

const socket = io(process.env.NEXT_PUBLIC_SOCKET_IO_URL, {
  withCredentials: true,
  auth: {
    token: getAuthToken() // Your JWT token from cookie or state
  }
})

socket.on('connect', () => {
  console.log('Socket.IO connected:', socket.id)
})

socket.on('connect_error', (error) => {
  console.error('Socket.IO connection error:', error)
})
```

### 2. ✅ Get Browser Location Permission

```typescript
// Check if geolocation is available
if (!navigator.geolocation) {
  console.error('Geolocation not supported')
  return
}

// Request permission
navigator.geolocation.getCurrentPosition(
  (position) => {
    console.log('Location permission granted')
    // Start tracking
  },
  (error) => {
    console.error('Location permission denied:', error)
    // Show error to user
  }
)
```

### 3. ✅ Send Location Updates Regularly

```typescript
// Start location tracking
const watchId = navigator.geolocation.watchPosition(
  (position) => {
    const locationData = {
      userId: currentUser.id, // Must match logged-in child's ID
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined,
      ts: new Date().toISOString() // ISO 8601 format
    }

    console.log('Sending location update:', locationData)

    // Send via Socket.IO
    socket.emit('location:update', locationData, (response) => {
      if (response.error) {
        console.error('Location update error:', response.error)
      } else {
        console.log('Location update success:', response)
      }
    })
  },
  (error) => {
    console.error('Geolocation error:', error)
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0 // Always get fresh location
  }
)

// Clean up on unmount
return () => {
  navigator.geolocation.clearWatch(watchId)
  socket.disconnect()
}
```

## 🐛 Common Issues

### Issue 1: userId Mismatch

**Problem:** `userId` in location update doesn't match logged-in child's ID

**Fix:**
```typescript
// Make sure you're using the correct child ID
const locationData = {
  userId: currentUser.id, // Must be the child's MongoDB ObjectId (24 chars)
  // ...
}
```

### Issue 2: Timestamp Format Wrong

**Problem:** `ts` field not in ISO 8601 format

**Fix:**
```typescript
ts: new Date().toISOString() // ✅ Correct: "2025-11-29T10:00:00.000Z"
// NOT: new Date().toString() ❌
// NOT: Date.now() ❌
```

### Issue 3: Socket.IO Not Authenticated

**Problem:** Socket.IO connection fails authentication

**Fix:**
```typescript
// Make sure JWT token is sent
const socket = io(url, {
  withCredentials: true,
  auth: {
    token: getAuthToken() // Get from cookie or state
  }
})
```

### Issue 4: Location Permission Denied

**Problem:** Browser blocks location access

**Fix:**
- User must click "Allow" when browser asks
- Must be on HTTPS (or localhost)
- Check browser settings

### Issue 5: Not Sending Updates Regularly

**Problem:** Only sending location once, not continuously

**Fix:**
```typescript
// Use watchPosition (not getCurrentPosition)
navigator.geolocation.watchPosition(...)

// Or set interval
setInterval(() => {
  navigator.geolocation.getCurrentPosition((pos) => {
    socket.emit('location:update', ...)
  })
}, 5000) // Every 5 seconds
```

## 🔍 Debugging Steps

### Step 1: Check Browser Console

Open browser DevTools → Console, look for:
- ✅ "Socket.IO connected"
- ✅ "Sending location update"
- ✅ "Location update success"
- ❌ Any errors?

### Step 2: Check Network Tab

Open DevTools → Network → WS (WebSocket):
- ✅ Socket.IO connection established?
- ✅ Messages being sent?
- ❌ Any connection errors?

### Step 3: Check Backend Logs

In Render logs, look for:
- ✅ `[Socket] Child connected: ...`
- ✅ `[Socket] Location update received from child ...`
- ✅ `[Socket] Location ping saved successfully`
- ❌ Any error messages?

### Step 4: Test Manually

```typescript
// Test Socket.IO connection
socket.emit('location:update', {
  userId: '692a7ccb05d44df0b685e436', // Your child ID
  lat: 37.7749,
  lng: -122.4194,
  accuracy: 10,
  ts: new Date().toISOString()
}, (response) => {
  console.log('Response:', response)
})
```

## ✅ Complete Working Example

```typescript
'use client'
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export default function LocationTracker({ userId }: { userId: string }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [locationSent, setLocationSent] = useState(0)

  useEffect(() => {
    // Get JWT token from cookie
    const getToken = () => {
      const cookies = document.cookie.split(';')
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=')
        if (name === 'safehome_token') {
          return value
        }
      }
      return null
    }

    // Connect to Socket.IO
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_IO_URL!, {
      withCredentials: true,
      auth: {
        token: getToken()
      }
    })

    newSocket.on('connect', () => {
      console.log('✅ Socket.IO connected')
      setConnected(true)
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.IO error:', error)
      setConnected(false)
    })

    setSocket(newSocket)

    // Start location tracking
    if (!navigator.geolocation) {
      console.error('❌ Geolocation not supported')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          userId: userId, // Must match logged-in child's ID
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined,
          ts: new Date().toISOString()
        }

        console.log('📍 Sending location:', locationData)

        newSocket.emit('location:update', locationData, (response: any) => {
          if (response?.error) {
            console.error('❌ Location update failed:', response.error)
          } else {
            console.log('✅ Location update success')
            setLocationSent(prev => prev + 1)
          }
        })
      },
      (error) => {
        console.error('❌ Geolocation error:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
      newSocket.disconnect()
    }
  }, [userId])

  return (
    <div>
      <p>Socket.IO: {connected ? '✅ Connected' : '❌ Disconnected'}</p>
      <p>Location Updates Sent: {locationSent}</p>
    </div>
  )
}
```

## 🎯 Quick Checklist

- [ ] Socket.IO connected and authenticated
- [ ] Browser location permission granted
- [ ] `userId` matches logged-in child's ID
- [ ] `ts` is in ISO 8601 format
- [ ] Location updates being sent regularly (every 5-10 seconds)
- [ ] No errors in browser console
- [ ] No errors in backend logs
- [ ] Check Render logs for `[Socket]` messages

## 📞 Next Steps

1. **Check browser console** - Are location updates being sent?
2. **Check Render logs** - Are updates being received?
3. **Verify userId** - Does it match the child's ID?
4. **Test manually** - Use the test code above

If still not working, share:
- Browser console errors
- Render log messages
- Socket.IO connection status

