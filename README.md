# Movie Application

A full-stack movie application with PostgreSQL, MongoDB, and Redis backend services.

## 🚀 Quick Start with Docker

### Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your system
- [Docker Compose](https://docs.docker.com/compose/install/) (usually comes with Docker Desktop)
- Git (to clone the repository)

### 🔧 Setup Instructions

1. **Clone the repository** (if not already done):
   ```bash
   git clone <your-repo-url>
   cd movie
   ```

2. **Environment Configuration**:
   - The `.env` file is already configured with default values
   - **Important**: Change the passwords in `.env` for production use
   - Current configuration:
     ```
     POSTGRES_PASSWORD=muadongamap
     MONGO_PASSWORD=muadongamap
     REDIS_PASSWORD=muadongamap
     ```

3. **Start the services**:
   ```bash
   docker-compose up -d
   ```

4. **Verify services are running**:
   ```bash
   docker-compose ps
   ```

### 📊 Services Overview

| Service    | Port | Description | Health Check |
|------------|------|-------------|--------------|
| PostgreSQL | 5432 | Main database | ✅ Enabled |
| MongoDB    | 27017| Document database | ⚠️ Manual |
| Redis      | 6379 | Cache & sessions | ⚠️ Manual |

### 🔍 Service Details

#### PostgreSQL
- **Image**: postgres:16
- **Database**: moviedb
- **Username**: postgres
- **Password**: muadongamap (from .env)
- **Volume**: Persistent data storage
- **Health Check**: Automatic readiness check

#### MongoDB
- **Image**: mongo:7
- **Database**: moviedb
- **Root Username**: admin
- **Root Password**: muadongamap (from .env)
- **Volume**: Persistent data storage

#### Redis
- **Image**: redis:7
- **Password**: Currently disabled for easier setup
- **Note**: Authentication commented out in docker-compose.yml

### 🛠️ Development Commands

#### Start services in foreground (with logs):
```bash
docker-compose up
```

#### Start services in background:
```bash
docker-compose up -d
```

#### Stop services:
```bash
docker-compose down
```

#### Stop services and remove volumes (⚠️ destroys data):
```bash
docker-compose down -v
```

#### View logs:
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs postgres
docker-compose logs mongo
docker-compose logs redis
```

#### Restart a specific service:
```bash
docker-compose restart postgres
```

### 🔧 Database Access

#### PostgreSQL
```bash
# Connect via Docker
docker-compose exec postgres psql -U postgres -d moviedb

# Connect from host (if psql installed)
psql -h localhost -U postgres -d moviedb
```

#### MongoDB
```bash
# Connect via Docker
docker-compose exec mongo mongosh -u admin -p muadongamap --authenticationDatabase admin

# MongoDB connection string
mongodb://admin:muadongamap@localhost:27017/moviedb?authSource=admin
```

#### Redis
```bash
# Connect via Docker
docker-compose exec redis redis-cli

# If password enabled, use:
# docker-compose exec redis redis-cli -a muadongamap
```

### 🏗️ Application Services (Coming Soon)

The docker-compose.yml includes commented sections for:
- **Backend API** (port 3001)
- **Frontend** (port 3000)

To enable these services:
1. Uncomment the backend and frontend sections in `docker-compose.yml`
2. Ensure you have `Dockerfile`s in the respective directories
3. Run `docker-compose up --build`

### 🐛 Troubleshooting

#### Services won't start:
```bash
# Check if ports are in use
netstat -an | findstr :5432
netstat -an | findstr :27017
netstat -an | findstr :6379

# View detailed logs
docker-compose logs <service-name>
```

#### Database connection issues:
```bash
# Check service health
docker-compose ps

# Wait for PostgreSQL to be ready
docker-compose exec postgres pg_isready -U postgres
```

#### Reset everything:
```bash
# Stop and remove containers, networks, and volumes
docker-compose down -v
docker-compose up -d
```

### 📁 Project Structure

```
movie/
├── docker-compose.yml    # Docker services configuration
├── .env                 # Environment variables
├── README.md           # This file
├── uploads/            # File uploads (when backend runs)
└── volumes/            # Docker persistent data
    ├── pgdata/         # PostgreSQL data
    └── mongodb/        # MongoDB data
```

### 🔒 Security Notes

- **Change default passwords** in `.env` for production
- **Enable Redis authentication** by uncommenting password configuration
- **Use environment-specific .env files** for different deployments
- **Consider using Docker secrets** for sensitive data in production

### 📝 Environment Variables

Key variables in `.env`:
- `POSTGRES_PASSWORD`: PostgreSQL password
- `MONGO_PASSWORD`: MongoDB password  
- `REDIS_PASSWORD`: Redis password
- `DATABASE_URL`: Full PostgreSQL connection string
- `MONGO_URL`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `PORT`: Backend server port
- `FRONTEND_URL`: Frontend application URL

### 🚀 Next Steps

1. **Develop your backend**: Create the movie-backend directory with your API
2. **Develop your frontend**: Create the movie-frontend directory with your UI
3. **Create Dockerfiles**: Add Dockerfile to each application directory
4. **Uncomment app services**: Enable backend and frontend in docker-compose.yml
5. **Build and deploy**: Use `docker-compose up --build`

### 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify all services are healthy: `docker-compose ps`
3. Ensure ports are not in use by other applications
4. Check Docker and Docker Compose versions

---

**Happy coding! 🎬🍿**