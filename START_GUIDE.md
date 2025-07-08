# Movie App - Hướng dẫn chạy ứng dụng

## Cấu hình port (CẬP NHẬT MỚI)

- **Backend (NestJS)**: Port 3001
- **Frontend (Next.js)**: Port 3000

## Cách chạy ứng dụng

### 1. Chạy Backend (Terminal 1)
```bash
cd c:\dev\repo\movie\backend
npm run start:dev
```
Backend sẽ chạy tại: `http://localhost:3001`
API endpoints: `http://localhost:3001/api/*`

### 2. Chạy Frontend (Terminal 2)
```bash
cd c:\dev\repo\movie\frontend
npm run dev
```
Frontend sẽ chạy tại: `http://localhost:3000`

## Truy cập ứng dụng

✅ **URL ĐÚNG**: `http://localhost:3000` (Frontend - Giao diện người dùng)
❌ **URL SAI**: `http://localhost:3001` (Backend - Chỉ cho API)

## Lỗi thường gặp

### 1. AxiosError 404
- **Nguyên nhân**: Truy cập sai URL hoặc frontend chưa chạy
- **Giải pháp**: 
  - Đảm bảo frontend chạy trên port 3000
  - Truy cập `http://localhost:3000` thay vì `http://localhost:3001`

### 2. genres.map is not a function
- **Nguyên nhân**: API trả về dữ liệu không đúng format
- **Giải pháp**: Đã fix bằng cách thêm validation `Array.isArray(genres)`

### 3. Port conflict
- **Nguyên nhân**: Backend và frontend chạy cùng port
- **Giải pháp**: Backend port 3001, Frontend port 3000

## Test API trực tiếp

```bash
# Test genres
Invoke-RestMethod -Uri "http://localhost:3001/api/genres" -Method GET

# Test movies
Invoke-RestMethod -Uri "http://localhost:3001/api/movies" -Method GET
```

## Cấu hình environment

### Backend (.env)
```
PORT=3001
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Dừng và khởi động lại

Nếu cần dừng và khởi động lại:

```bash
# Dừng tất cả Node.js processes
Get-Process | Where-Object { $_.ProcessName -like "*node*" } | Stop-Process -Force

# Khởi động lại backend (port 3001)
cd c:\dev\repo\movie\backend
npm run start:dev

# Khởi động lại frontend (port 3000) 
cd c:\dev\repo\movie\frontend
npm run dev
```
