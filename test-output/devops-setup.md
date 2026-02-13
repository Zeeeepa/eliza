Here's a comprehensive DevOps setup for your Task Management API:

### 1. Dockerfile (Multi-stage Build)
```dockerfile
# Build Stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
RUN npm run build

# Production Stage
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm install --production --no-optional
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1
CMD ["node", "dist/main.js"]
```

### 2. docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - task-management-net

  db:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/migrations:/migrations
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - task-management-net

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data
    command: redis-server --requirepass ${REDIS_PASSWORD}
    networks:
      - task-management-net

volumes:
  pgdata:
  redisdata:

networks:
  task-management-net:
    driver: bridge
```

### 3. Database Migrations & Seed Data
#### Migration Script (db/migrations/create_tasks_table.sql)
```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Rollback Script (db/migrations/drop_tasks_table.sql)
```sql
DROP TABLE IF EXISTS tasks;
```

#### Seed Data (db/seeds/tasks_seed.sql)
```sql
INSERT INTO tasks (title, description, status) VALUES
('Setup project', 'Initialize Docker and database', 'completed'),
('Implement API endpoints', 'Create RESTful routes for tasks', 'in-progress');
```

### 4. .env.example
```ini
# Application Configuration
APP_PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=db
DB_PORT=5432
DB_USER=taskuser
DB_PASSWORD=securepassword
DB_NAME=taskdb

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redispassword

# Rate Limiting
RATE_LIMIT_WINDOW=60 # seconds
RATE_LIMIT_MAX_REQUESTS=100 # per window

# JWT Authentication
JWT_SECRET=mysecretkey123
JWT_EXPIRES_IN=1h

# Logging
LOG_LEVEL=info
```

### 5. GitHub Actions CI/CD Workflow (.github/workflows/ci-cd.yml)
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
        
    - name: Install dependencies
      run: npm ci
      
    - name: Wait for services
      run: |
        echo "Waiting for Postgres..."
        while ! nc -z localhost 5432; do sleep 1; done
        echo "Postgres is ready!"
        
        echo "Waiting for Redis..."
        while ! nc -z localhost 6379; do sleep 1; done
        echo "Redis is ready!"
      
    - name: Run tests
      run: npm test
      
  build-and-deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
        
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        file: ./Dockerfile
        push: true
        tags: myregistry/task-api:${{ github.sha }}, myregistry/task-api:latest
        
    - name: Deploy to Staging
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.STAGING_SERVER_IP }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          docker stop task-api || true
          docker rm task-api || true
          docker pull myregistry/task-api:latest
          docker run -d \
            --name task-api \
            -p 80:3000 \
            -e DB_HOST=db-staging \
            -e REDIS_HOST=redis-staging \
            myregistry/task-api:latest
```

### Key Features Implemented:
1. **Multi-stage Docker build**: Separates build dependencies from runtime
2. **Non-root user**: Runs application as non-root user for security
3. **Health checks**: Both application and database health monitoring
4. **Volume management**: Persistent storage for databases
5. **Network isolation**: Dedicated network for services
6. **Database migration support**: SQL-based migrations with rollback
7. **Seed data**: Initial dataset for development
8. **Comprehensive .env example**: All required configuration variables
9. **CI/CD pipeline**: 
   - Automated testing with service dependencies
   - Docker image building and pushing
   - Staging deployment via SSH

This setup provides a production-ready foundation that can be extended with additional features like Kubernetes manifests, Prometheus/Grafana monitoring, or more advanced CI/CD stages as needed.