# Dashboard Module

This module contains all dashboard-related functionality for the AI News Service, providing a clean separation of concerns from the main application logic.

## Structure

```
src/dashboard/
├── index.ts                 # Main dashboard module exports
├── routes/
│   ├── dashboard.ts         # Dashboard API routes
│   └── analytics.ts         # Analytics tracking routes
├── views/
│   └── dashboard.html       # Dashboard HTML template
├── middleware/              # Dashboard-specific middleware (future use)
└── README.md               # This documentation
```

## Routes

### Dashboard Routes (`/api/v1/dashboard/`)

- **GET `/stats`** - Returns comprehensive dashboard statistics
- **GET `/`** - Serves the dashboard HTML interface  
- **POST `/trigger-collection`** - Manually triggers news collection

### Analytics Routes (`/api/v1/analytics/`)

- **POST `/page-view`** - Records page view events
- **POST `/audio-start`** - Records audio playback start events
- **POST `/audio-end`** - Records audio playback end events

### Legacy Routes

- **GET `/console/dashboard`** - Redirects to `/api/v1/dashboard/` for backward compatibility

## Features

### Dashboard Interface
- Real-time statistics display
- Manual news collection trigger
- System health monitoring
- User analytics tracking
- Responsive design with Tailwind CSS

### Statistics Tracked
- News collection runs and results
- API usage (NewsAPI, OpenAI calls)
- Storage statistics (articles, audio files)
- User engagement metrics
- System performance metrics

## Usage

The dashboard module is automatically mounted in the main application:

```typescript
import dashboardRoutes from './dashboard';
app.use('/api/v1', dashboardRoutes);
```

Access the dashboard at: `http://localhost:3001/api/v1/dashboard/`

## Dependencies

- Express.js for routing
- StatsService for data collection
- NewsStorage and AudioService for storage statistics
- Tailwind CSS for styling (loaded via CDN)

## Error Handling

All routes include comprehensive error handling with appropriate HTTP status codes and logging through the central logger service. 