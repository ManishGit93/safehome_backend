# Socket.IO Location Update Test Guide

## 🔍 Problem: No Location Pings Despite Everything Being Set Up

**Current Status:**
- ✅ Child logged in
- ✅ Link ACCEPTED
- ✅ Consent given
- ❌ No location pings received

## 🧪 Test Socket.IO Connection

### Step 1: Verify Socket.IO is Connected

In browser console (on child's device/app), run:

```javascript
// Check if socket is connected
console.log('Socket connected:', socket?.connected)
console.log('Socket ID:', socket?.id)
```

### Step 2: Test Location Update Manually

In browser console, test sending a location update:

```javascript
// Get the child's user ID (from /me endpoint)
const childId = '692a7ccb05d44df0b685e436' // Your child ID

// Test location update
socket.emit('location:update', {
  userId: childId,
  lat: 28.6139,  // Example: Delhi coordinates
  lng: 77.2090,
  accuracy: 10,
  ts: new Date().toISOString()
}, (response) => {
  console.log('Location update response:', response)
  if (response.error) {
    console.error('Error:', response.error)
  } else {
    console.log('✅ Success! Location saved')
  }
})
```

### Step 3: Check Backend Logs

After sending test location, check Render logs for:
```
[Socket] Location update received from child 692a7ccb05d44df0b685e436
[Socket] Location ping saved successfully
```

## 🔧 Frontend Implementation Check

### Required Frontend Code

Your frontend MUST have this code running on the child's device:

```typescript
'use client'
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

export default function ChildLocationTracker() {
  const [socket, setSocket] = useState<any>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // 1. Get JWT token from cookie
    const getToken = () => {
      const cookies = document.cookie.split(';')
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=')
        if (name === 'safehome_token') {
          return decodeURIComponent(value)
        }
      }
      return null
    }

    // 2. Connect to Socket.IO
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_IO_URL!, {
      withCredentials: true,
      auth: {
        token: getToken()
      }
    })

    newSocket.on('connect', () => {
      console.log('✅ Socket.IO connected:', newSocket.id)
      setConnected(true)
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error)
      setConnected(false)
    })

    newSocket.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected')
      setConnected(false)
    })

    setSocket(newSocket)

    // 3. Get child's user ID
    const getChildId = async () => {
      try {
        const res = await fetch('/me', {
          credentials: 'include'
        })
        const data = await res.json()
        return data.user.id
      } catch (error) {
        console.error('Failed to get user ID:', error)
        return null
      }
    }

    // 4. Start location tracking
    let watchId: number | null = null
    let childId: string | null = null

    const startLocationTracking = async () => {
      childId = await getChildId()
      if (!childId) {
        console.error('❌ Cannot get child ID')
        return
      }

      if (!navigator.geolocation) {
        console.error('❌ Geolocation not supported')
        return
      }

      // Request location permission
      navigator.geolocation.getCurrentPosition(
        () => {
          console.log('✅ Location permission granted')
          
          // Start watching position
          watchId = navigator.geolocation.watchPosition(
            (position) => {
              const locationData = {
                userId: childId, // Must match logged-in child's ID
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                speed: position.coords.speed || undefined,
                heading: position.coords.heading || undefined,
                ts: new Date().toISOString() // ISO 8601 format
              }

              console.log('📍 Sending location:', locationData)

              // Send via Socket.IO
              newSocket.emit('location:update', locationData, (response: any) => {
                if (response?.error) {
                  console.error('❌ Location update error:', response.error)
                } else {
                  console.log('✅ Location update success:', response)
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
        },
        (error) => {
          console.error('❌ Location permission denied:', error)
        }
      )
    }

    // Start tracking after socket connects
    if (newSocket.connected) {
      startLocationTracking()
    } else {
      newSocket.once('connect', () => {
        startLocationTracking()
      })
    }

    // Cleanup
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
      newSocket.disconnect()
    }
  }, [])

  return (
    <div>
      <p>Socket.IO: {connected ? '✅ Connected' : '❌ Disconnected'}</p>
      {socket && <p>Socket ID: {socket.id}</p>}
    </div>
  )
}
```

## 🐛 Common Issues

### Issue 1: Socket.IO Not Connecting

**Symptoms:**
- `socket.connected` is `false`
- No `connect` event fired

**Fix:**
- Check JWT token is valid
- Check `NEXT_PUBLIC_SOCKET_IO_URL` is correct
- Check CORS settings
- Check browser console for errors

### Issue 2: Location Permission Denied

**Symptoms:**
- Geolocation error in console
- No location updates sent

**Fix:**
- User must click "Allow" when browser asks
- Must be on HTTPS (or localhost)
- Check browser settings → Site permissions → Location

### Issue 3: userId Mismatch

**Symptoms:**
- Location updates sent but rejected
- Error: "User mismatch"

**Fix:**
- Make sure `userId` in location update matches logged-in child's ID
- Get child ID from `/me` endpoint, not hardcode

### Issue 4: Timestamp Format Wrong

**Symptoms:**
- Validation error
- Error about datetime format

**Fix:**
- Use `new Date().toISOString()` (not `Date.now()` or `new Date().toString()`)

## 🔍 Debugging Steps

### 1. Check Browser Console

Open DevTools → Console, look for:
- ✅ "Socket.IO connected"
- ✅ "Location permission granted"
- ✅ "Sending location"
- ✅ "Location update success"
- ❌ Any errors?

### 2. Check Network Tab

Open DevTools → Network → WS (WebSocket):
- ✅ Socket.IO connection established?
- ✅ Messages being sent?
- ❌ Connection errors?

### 3. Check Render Logs

In Render Dashboard → Logs, look for:
- ✅ `[Socket] Child connected: ...`
- ✅ `[Socket] Location update received from child ...`
- ✅ `[Socket] Location ping saved successfully`
- ❌ Any error messages?

### 4. Test Endpoint

Use the new status endpoint:

```bash
GET /children/692a7ccb05d44df0b685e436/status
```

This will show:
- Child info
- Link status
- Consent status
- Location data status
- Recommendations

## ✅ Quick Test

Run this in browser console (on child's device):

```javascript
// 1. Check socket connection
console.log('Socket connected:', window.socket?.connected)

// 2. Test location update
window.socket?.emit('location:update', {
  userId: '692a7ccb05d44df0b685e436',
  lat: 28.6139,
  lng: 77.2090,
  accuracy: 10,
  ts: new Date().toISOString()
}, (response) => {
  console.log('Response:', response)
})
```

## 📞 Next Steps

1. **Check if frontend has location tracking code** - Is the component mounted?
2. **Check browser console** - Any errors?
3. **Check Render logs** - Any `[Socket]` messages?
4. **Test manually** - Use the test code above
5. **Verify userId** - Does it match the child's ID?

If still not working, share:
- Browser console output
- Render log messages
- Frontend code that handles location tracking

