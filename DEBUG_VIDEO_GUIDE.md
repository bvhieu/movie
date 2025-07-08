# Debug Video Player Issue

## Vấn đề
- `/minimal-video` → Video phát được ✅
- Click từ home page → Video không phát được ❌

## Các bước debug

### 1. Kiểm tra Console Logs
Mở browser developer tools và check console khi:
- Vào `/movie/11?autoplay=true` trực tiếp
- Click phim từ home page
- So sánh logs giữa 2 trường hợp

### 2. Kiểm tra Network Tab
Trong Network tab, xem:
- Có request đến `/api/movies/11` không?
- Có request đến `/api/movies/11/stream` không? 
- Response status codes là gì?

### 3. Test các trang debug
- `/minimal-video` - Should work
- `/movie/11?autoplay=true` - Direct navigation  
- `/debug-movie/11?autoplay=true` - Debug version
- `/comparison-test` - Side by side comparison
- `/isolated-test` - Router vs direct tests

### 4. Kiểm tra environment variables
```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

### 5. Possible Issues và Solutions

#### Issue A: Next.js SSR/Hydration
**Symptoms:** Component mounts/unmounts multiple times
**Solution:** 
```jsx
// Add key prop to force remount
<EnhancedVideoPlayer key={movieId} movieId={movieId} />
```

#### Issue B: Router Navigation
**Symptoms:** Works with direct URL, fails with router.push
**Solution:** Check if using router.refresh() or window.location.reload()

#### Issue C: Multiple Component Instances  
**Symptoms:** Video works in one context but not another
**Solution:** Use React.memo or useMemo to prevent unnecessary recreations

#### Issue D: Environment Variables Not Loading
**Symptoms:** API_URL is undefined in some contexts
**Solution:** Check .env.local and restart dev server

### 6. Quick Fixes to Try

#### Fix 1: Force Component Remount
```jsx
// In movie/[id]/page.tsx
<EnhancedVideoPlayer 
  key={`${movieId}-${autoplay}`}
  movieId={movieId} 
  autoPlay={autoplay} 
/>
```

#### Fix 2: Add Loading State
```jsx
const [isReady, setIsReady] = useState(false);

useEffect(() => {
  setIsReady(true);
}, []);

if (!isReady) return <div>Loading...</div>;
```

#### Fix 3: Check URL Parameters
```jsx
// Ensure movieId is parsed correctly
const movieId = parseInt(params.id as string, 10);
if (isNaN(movieId)) {
  return <div>Invalid movie ID</div>;
}
```

### 7. Debug Commands

```bash
# Restart frontend with clean cache
cd frontend
rm -rf .next
npm run dev

# Check if backend is responding
curl -v http://localhost:3001/api/movies/11/stream

# Test with different browsers
# Chrome, Firefox, Safari to see if browser-specific
```

### 8. Current Debug URLs
- http://localhost:3002/minimal-video (works)
- http://localhost:3002/movie/11?autoplay=true (might not work)
- http://localhost:3002/debug-movie/11?autoplay=true
- http://localhost:3002/comparison-test
- http://localhost:3002/isolated-test
- http://localhost:3002/diagnostic

## Next Steps
1. Compare console logs between working and non-working cases
2. Check if it's a timing issue (component mounting before DOM ready)
3. Verify if environment variables are loaded correctly
4. Test with different movie IDs
5. Check if it's specific to autoplay parameter
