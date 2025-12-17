# Docker Setup Guide for Memorio

This guide will help you run the Memorio application fully on Docker.

## Prerequisites

- Docker and Docker Compose installed
- Your PostgreSQL database already running in Docker
- OAuth2 credentials (Google and/or Facebook)

## Quick Start

### 1. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` and configure:

- **Database**: Update `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` to match your existing PostgreSQL container
- **JWT Secret**: Generate a secure secret key (see instructions below)
- **OAuth2 Credentials**: Add your Google and Facebook OAuth2 credentials

#### Generate JWT Secret

```bash
openssl rand -base64 64
```

#### Database URL Format

If your PostgreSQL is running in Docker, use:
```
DB_URL=jdbc:postgresql://host.docker.internal:5432/memorio
```

Or if you want to connect the containers to the same network:
```
DB_URL=jdbc:postgresql://postgres-container-name:5432/memorio
```

### 2. Configure Backend Application Properties

Copy the example application properties:

```bash
cp backend/src/main/resources/application.properties.example backend/src/main/resources/application.properties
```

The file is already configured to read from environment variables, so no changes needed.

### 3. Connect to Your Existing PostgreSQL Network (Optional)

If your PostgreSQL container is on a specific Docker network, update `docker-compose.yml`:

```yaml
networks:
  memorio-network:
    external: true
    name: your-existing-postgres-network
```

Find your PostgreSQL network name:
```bash
docker inspect your-postgres-container-name | grep NetworkMode
```

### 4. Build and Run

Build and start the containers:

```bash
docker-compose up --build
```

Or run in detached mode:

```bash
docker-compose up --build -d
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api
- **Backend Health Check**: http://localhost:8080/actuator/health

## Container Management

### View Logs

```bash
# All containers
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop Containers

```bash
docker-compose down
```

### Rebuild After Code Changes

```bash
docker-compose up --build
```

### Remove Everything (including volumes)

```bash
docker-compose down -v
```

## OAuth2 Configuration

### Google OAuth2

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:8080/login/oauth2/code/google`
4. Copy Client ID and Client Secret to `.env`

### Facebook OAuth2

1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Create a new app or use existing one
3. Add Facebook Login product
4. Add redirect URI: `http://localhost:8080/login/oauth2/code/facebook`
5. Copy App ID and App Secret to `.env`

## Troubleshooting

### Backend Can't Connect to Database

**Issue**: `Connection refused` or `Unknown host`

**Solutions**:
- Use `host.docker.internal` instead of `localhost` in `DB_URL`
- Or connect containers to the same network (see step 3)
- Ensure your PostgreSQL container is running: `docker ps`

### Port Already in Use

**Issue**: `Bind for 0.0.0.0:8080 failed: port is already allocated`

**Solution**: Change the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "8081:8080"  # Use 8081 instead of 8080
```

### Frontend Can't Reach Backend

**Issue**: API calls fail with CORS errors

**Solution**: 
- Ensure `FRONTEND_URL` in `.env` matches your frontend URL
- Check that nginx is properly proxying requests (see `frontend/nginx.conf`)

### OAuth2 Redirect Issues

**Issue**: OAuth2 login fails or redirects incorrectly

**Solution**:
- Ensure redirect URIs in `.env` match those configured in Google/Facebook
- For production, update redirect URIs to use your domain instead of `localhost`

## Production Deployment

For production deployment, update:

1. **Environment Variables**:
   - Use production database URL
   - Use production domain in redirect URIs
   - Increase JWT expiration time if needed

2. **Docker Compose**:
   - Remove port mappings and use a reverse proxy (nginx, Traefik)
   - Add SSL/TLS certificates
   - Configure proper logging and monitoring

3. **OAuth2 Redirect URIs**:
   ```
   GOOGLE_REDIRECT_URI=https://yourdomain.com/login/oauth2/code/google
   FACEBOOK_REDIRECT_URI=https://yourdomain.com/login/oauth2/code/facebook
   FRONTEND_URL=https://yourdomain.com
   ```

## Architecture

```
┌─────────────────┐
│   Frontend      │
│   (React/Vite)  │
│   Port: 3000    │
│   (nginx)       │
└────────┬────────┘
         │
         │ HTTP Requests
         │
┌────────▼────────┐
│   Backend       │
│   (Spring Boot) │
│   Port: 8080    │
└────────┬────────┘
         │
         │ JDBC
         │
┌────────▼────────┐
│   PostgreSQL    │
│   (Existing)    │
│   Port: 5432    │
└─────────────────┘
```

## Health Checks

Both containers have health checks configured:

- **Backend**: Checks `/actuator/health` endpoint
- **Frontend**: Checks nginx is serving content

View health status:
```bash
docker ps
```

Look for `(healthy)` status in the STATUS column.

## Support

For issues or questions, check the logs:
```bash
docker-compose logs -f
```
