# Debugging Location Tracking Issues

## 🔍 Problem Analysis

Based on your symptoms:
1. **Parent sees**: "Awaiting first ping" - No location data
2. **Child sees**: "Pending link requests" - Empty array
3. **API responses**: Empty arrays

## 📋 Root Causes & Solutions

### Issue 1: Parent-Child Link Not Established

**Problem**: Link status must be `ACCEPTED` for parent to see child location.

**Check**:
```bash
# Check if link exists and status
GET /links/pending (as child) - Should show pending requests
GET /links (as parent) - Should show all links
```

**Solution Flow**:
1. **Parent sends request**: `POST /links/request` with `{ childEmail: "child@example.com" }`
2. **Child sees request**: `GET /links/pending` should return the request
3. **Child accepts**: `POST /links/accept` with `{ linkId: "..." }`
4. **Link status becomes**: `ACCEPTED`
5. **Parent can now see**: Child in `/children` endpoint

---

### Issue 2: Child Consent Not Given

**Problem**: Even if link is ACCEPTED, child must give consent before sending location.

**Check**:
```bash
# Check child consent status
GET /me (as child) - Check "consentGiven" field
```

**Solution**:
1. Child must call: `POST /me/consent` with `{ consentGiven: true, consentTextVersion: "v1" }`
2. After consent, location updates will be accepted

---

### Issue 3: Location Updates Not Being Sent

**Problem**: Child's device might not be sending location via Socket.IO.

**Check**:
1. Is Socket.IO connected?
2. Is location permission granted in browser?
3. Is location being sent via `location:update` event?

**Solution**:
Frontend must:
1. Connect to Socket.IO
2. Get browser location permission
3. Send location updates regularly

---

## 🔧 Step-by-Step Debugging

### Step 1: Verify Link Status

**As Parent:**
```bash
GET https://safehome-backend-cyky.onrender.com/links
# Should return: { links: [...] }
# Check if link exists and status = "ACCEPTED"
```

**As Child:**
```bash
GET https://safehome-backend-cyky.onrender.com/links/pending
# Should return: { links: [...] }
# If empty, either:
# - No request was sent
# - Request was already accepted/declined
```

### Step 2: Check Child Consent

**As Child:**
```bash
GET https://safehome-backend-cyky.onrender.com/me
# Check response: { user: { consentGiven: true/false } }
```

If `consentGiven: false`, child must:
```bash
POST https://safehome-backend-cyky.onrender.com/me/consent
Body: { consentGiven: true, consentTextVersion: "v1" }
```

### Step 3: Verify Location Data Exists

**Check Latest Location:**
```bash
GET https://safehome-backend-cyky.onrender.com/children/{childId}/locations
# Should return: { pings: [...] }
```

If empty, child hasn't sent any location updates yet.

### Step 4: Check Socket.IO Connection

**Frontend must:**
1. Connect to Socket.IO server
2. Authenticate with JWT token
3. Send `location:update` events

---

## 🐛 Common Issues & Fixes

### Issue A: Link Status is PENDING

**Symptom**: Parent can't see child, child sees pending request

**Fix**:
1. Child goes to pending requests page
2. Child clicks "Accept" on the link request
3. Link status changes to ACCEPTED
4. Parent can now see child

### Issue B: Consent Not Given

**Symptom**: Link is ACCEPTED but location not showing

**Fix**:
1. Child must give consent first
2. Call `POST /me/consent` with `consentGiven: true`
3. Then location updates will work

### Issue C: No Location Pings

**Symptom**: Link ACCEPTED, consent given, but still no location

**Fix**:
1. Check browser location permission
2. Check Socket.IO connection
3. Check if frontend is sending `location:update` events
4. Check browser console for errors

### Issue D: Wrong Child ID

**Symptom**: API returns 403 or empty data

**Fix**:
1. Verify you're using correct child ID
2. Check if parent is linked to that specific child
3. Check link status is ACCEPTED

---

## 📝 Complete Flow Checklist

### For Parent to See Child Location:

- [ ] **Step 1**: Parent sends link request
  - `POST /links/request` with child email
  - Link created with status `PENDING`

- [ ] **Step 2**: Child accepts link
  - Child sees request in `/links/pending`
  - Child calls `POST /links/accept` with linkId
  - Link status becomes `ACCEPTED`

- [ ] **Step 3**: Child gives consent
  - Child calls `POST /me/consent` with `consentGiven: true`
  - `consentGiven` field becomes `true`

- [ ] **Step 4**: Child sends location
  - Frontend connects to Socket.IO
  - Gets browser location permission
  - Sends `location:update` events regularly

- [ ] **Step 5**: Parent sees location
  - Parent calls `GET /children` - sees child with location
  - Parent calls `GET /children/{childId}/locations` - sees history

---

## 🔍 API Testing Commands

### Test Link Creation (as Parent):
```bash
curl -X POST https://safehome-backend-cyky.onrender.com/links/request \
  -H "Content-Type: application/json" \
  -H "Cookie: safehome_token=YOUR_JWT_TOKEN" \
  -d '{"childEmail": "child@example.com"}'
```

### Test Link Acceptance (as Child):
```bash
curl -X POST https://safehome-backend-cyky.onrender.com/links/accept \
  -H "Content-Type: application/json" \
  -H "Cookie: safehome_token=YOUR_JWT_TOKEN" \
  -d '{"linkId": "LINK_ID_HERE"}'
```

### Test Consent (as Child):
```bash
curl -X POST https://safehome-backend-cyky.onrender.com/me/consent \
  -H "Content-Type: application/json" \
  -H "Cookie: safehome_token=YOUR_JWT_TOKEN" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN" \
  -d '{"consentGiven": true, "consentTextVersion": "v1"}'
```

### Check Pending Links (as Child):
```bash
curl https://safehome-backend-cyky.onrender.com/links/pending \
  -H "Cookie: safehome_token=YOUR_JWT_TOKEN"
```

### Check All Links (as Parent):
```bash
curl https://safehome-backend-cyky.onrender.com/links \
  -H "Cookie: safehome_token=YOUR_JWT_TOKEN"
```

---

## 🎯 Quick Fix Summary

**Most likely issues in order:**

1. **Link not ACCEPTED** → Child must accept the link request
2. **Consent not given** → Child must give consent
3. **Location not being sent** → Frontend not sending Socket.IO events
4. **Socket.IO not connected** → Check frontend connection
5. **Browser permission denied** → User must allow location access

---

## 📞 Next Steps

1. **Check link status** - Verify link is ACCEPTED
2. **Check consent** - Verify child has given consent
3. **Check Socket.IO** - Verify frontend is connected and sending updates
4. **Check browser console** - Look for errors
5. **Check network tab** - Verify API calls are successful

Let me know which step is failing and I can help debug further!

