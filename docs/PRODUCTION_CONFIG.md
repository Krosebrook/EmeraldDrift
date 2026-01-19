# Production Configuration Guide

> **Version**: 1.0.0  
> **Last Updated**: January 2026

## Overview

This guide covers production configuration for Creator Studio Lite, including database setup, secrets management, deployment optimization, and monitoring.

---

## Database Configuration

### PostgreSQL Setup

The application uses a PostgreSQL database. In production, database credentials are securely injected via environment variables.

**Required Environment Variables:**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Full connection string (PostgreSQL) |
| `PGHOST` | Database host address |
| `PGPORT` | Database port (default: 5432) |
| `PGDATABASE` | Database name |
| `PGUSER` | Database username |
| `PGPASSWORD` | Database password (secret) |

**Connection String Format:**
```
postgresql://PGUSER:PGPASSWORD@PGHOST:PGPORT/PGDATABASE?sslmode=require
```

### Database Best Practices

1. **Use SSL**: Always enable SSL for production connections (`sslmode=require`)
2. **Connection Pooling**: Configure connection pooling for optimal performance
3. **Migrations**: Use ORM migrations (Drizzle/Prisma) for schema changes
4. **Backups**: Enable automated daily backups
5. **Monitoring**: Monitor connection count and query performance

---

## Secrets Management

### Required Secrets

Store these as encrypted secrets (not plain environment variables):

| Secret | Description | Required For |
|--------|-------------|--------------|
| `SESSION_SECRET` | Express session encryption key | Authentication |
| `PGPASSWORD` | Database password | Database connection |

### Optional API Secrets

| Secret | Description |
|--------|-------------|
| `OPENAI_API_KEY` | OpenAI API for AI content generation |
| `GOOGLE_GEMINI_API_KEY` | Google Gemini for merch mockups |
| `STRIPE_SECRET_KEY` | Stripe for payment processing |

### Security Guidelines

1. **Never commit secrets** to version control
2. **Rotate secrets** periodically (recommended: every 90 days)
3. **Use different secrets** for development and production
4. **Audit access** to production secrets regularly

---

## Deployment Options

### Autoscale Deployment (Cost-Optimized)

Best for: Variable traffic, development/staging, cost-conscious projects

**Characteristics:**
- Scales down to zero when idle (saves costs)
- Cold start on first request after inactivity
- Pay only when actively serving requests
- Auto-scales based on traffic

**Cold Start Optimization:**
1. Minimize bundle size (tree-shake unused code)
2. Lazy-load non-critical modules
3. Keep initialization logic lightweight
4. Use CDN for static assets

### Reserved VM Deployment (Performance-Optimized)

Best for: Production apps, consistent traffic, low-latency requirements

**Characteristics:**
- Always-on, no cold starts
- Predictable monthly cost
- Consistent performance
- Suitable for long-running processes

**When to Choose Reserved:**
- Latency-sensitive applications
- Apps with consistent traffic patterns
- Background job processing
- Real-time features (websockets)

---

## Environment Configuration

### Development Environment

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=<development_database_url>
SESSION_SECRET=<dev_session_secret>
```

### Production Environment

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=<production_database_url>
SESSION_SECRET=<prod_session_secret>
```

### Environment Variable Best Practices

1. **Use `shared` environment** for values that are the same across dev/prod
2. **Use environment-specific vars** for URLs, API keys that differ
3. **Never expose secrets in client code** - only server-side access
4. **Validate required vars on startup** - fail fast if missing

---

## Monitoring & Observability

### Recommended Setup

1. **Error Tracking**: Integrate Sentry for crash reporting
2. **Performance Monitoring**: Track API latency and response times
3. **Log Management**: Centralize logs for debugging
4. **Uptime Monitoring**: Set up health check endpoints

### Health Check Endpoint

The backend exposes `/api/health` for monitoring:

```javascript
// Response format
{
  "status": "ok",
  "timestamp": "2026-01-17T12:00:00.000Z",
  "uptime": 3600
}
```

---

## Pre-Deployment Checklist

- [ ] All secrets are stored securely (not in code)
- [ ] Database credentials are environment-specific
- [ ] SSL is enabled for database connections
- [ ] Error tracking is configured
- [ ] Health check endpoint is accessible
- [ ] Environment variables are validated on startup
- [ ] Logging is configured for production
- [ ] Bundle size is optimized

---

## Scaling Considerations

### When to Scale Up

- Response times exceed 500ms consistently
- Error rate increases due to resource exhaustion
- Database connection limits are reached
- Memory usage exceeds 80%

### Horizontal Scaling

Autoscale handles this automatically, but for Reserved VMs:
- Add more instances behind a load balancer
- Ensure session storage is shared (Redis)
- Database connection pooling becomes critical

---

## Troubleshooting

### Common Issues

**Cold Start Latency**
- Solution: Switch to Reserved VM or optimize initialization

**Database Connection Errors**
- Check: SSL configuration, firewall rules, connection limits

**Session Not Persisting**
- Check: SESSION_SECRET is set, cookie configuration, HTTPS in production

**Memory Issues**
- Check: Memory leaks, large file uploads, unoptimized queries
