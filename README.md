# Weather Dashboard

A production-quality weather dashboard built with Next.js (App Router), Bun, TypeScript, and Tailwind CSS. Features current weather conditions and a 5-day forecast with a beautiful, responsive UI.

## Features

- **Search by City**: Search for any city worldwide to get current weather conditions
- **Current Weather**: Temperature, humidity, wind speed, sunrise/sunset times
- **5-Day Forecast**: Daily forecasts with high/low temperatures and weather conditions
- **Recent Searches**: Last 5 searched cities are persisted and shown as suggestions
- **10-Minute Caching**: Weather data is cached per-city to minimize API calls
- **Responsive Design**: Works on mobile (≤480px), tablet (~768px), and desktop (≥1280px)
- **Loading & Error States**: Skeleton loaders and user-friendly error messages

## Quick Start

```bash
# Clone the repository
cd weather-dashboard

# Copy environment file and add your API key
cp .env.example .env.local
# Edit .env.local and add your OpenWeatherMap API key

# Install dependencies and start
bun install && bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENWEATHER_API_KEY` | Your OpenWeatherMap API key | Yes |

Get a free API key at [OpenWeatherMap](https://openweathermap.org/api).

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Runtime**: Bun
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest
- **Database**: Bun's built-in SQLite (for recent searches)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── weather/route.ts    # Weather data endpoint
│   │   └── searches/route.ts   # Recent searches endpoint
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main dashboard page
├── components/
│   ├── CurrentWeather.tsx      # Current weather display
│   ├── ErrorMessage.tsx        # Error state component
│   ├── ForecastCard.tsx        # Forecast card & list
│   ├── LoadingState.tsx        # Loading skeletons
│   ├── SearchBar.tsx           # Search with autocomplete
│   └── WeatherIcon.tsx         # Custom weather icons
├── lib/
│   ├── cache.ts                # In-memory cache (10-min TTL)
│   ├── database.ts             # SQLite database helper
│   └── weather-service.ts      # Weather API service
├── types/
│   └── weather.ts              # TypeScript interfaces
└── __tests__/
    ├── cache.test.ts           # Cache unit tests
    ├── weather-transform.test.ts  # Transform unit tests
    └── api-weather.test.ts     # API integration tests
```

## Architecture Decisions

### Caching Strategy

- **Approach**: In-memory `Map`-based cache with 10-minute TTL per city
- **Why**: Simple, efficient, and appropriate for a single-server deployment. The cache normalizes city names (lowercase, trimmed) to maximize cache hits.
- **Trade-offs**: Cache is not shared across server instances. For a distributed deployment, Redis or similar would be preferred.

### Database Choice

- **Approach**: Bun's built-in SQLite for recent searches
- **Why**: Zero configuration, embedded with Bun runtime, perfect for lightweight persistence
- **Schema**: Single table with city name and timestamp, limited to 5 entries

### Error Handling

- Explicit error codes (`INVALID_CITY`, `RATE_LIMIT`, `NETWORK_ERROR`, etc.)
- User-friendly messages with no raw API responses exposed
- Proper HTTP status codes (400, 404, 429, 500, 503)

### Server Components vs Client Components

- **Server Components**: API routes handle data fetching securely (API key stays server-side)
- **Client Components**: Interactive UI elements (search, state management) marked with `"use client"`
- This hybrid approach maximizes security while enabling rich interactivity

## Available Scripts

```bash
bun run dev            # Start development server (with Turbopack)
bun run build          # Build for production
bun run start          # Start production server
bun run lint           # Run ESLint
bun run test           # Run tests in watch mode
bun run test:run       # Run tests once
bun run test:coverage  # Run tests once and print a coverage report
```

## Testing

The test suite covers both the backend (API routes, caching, database, weather
transforms, validation) and the UI (every component plus the main page),
using Vitest and React Testing Library.

### Run the tests

```bash
bun run test        # watch mode
bun run test:run    # single run (used in CI)
```

### Run with coverage

```bash
bun run test:coverage
```

This runs the full suite once and prints a text coverage summary to the
terminal, plus writes an HTML report to `coverage/index.html` (open it
directly in a browser for a file-by-file, line-by-line breakdown) and a
`coverage/coverage-final.json` for tooling. The project currently sits at
~99% statement/line coverage and ~98% branch coverage.

## Responsive Breakpoints

| Breakpoint | Width | Layout Adjustments |
|------------|-------|-------------------|
| Mobile | ≤480px | Stacked layout, horizontal scroll forecast |
| Tablet | ~768px | 2-column grid, larger touch targets |
| Desktop | ≥1280px | Full layout, 5-column forecast grid |

All touch targets are at least 44px for accessibility.

## Future Improvements

With more time, I would add:

1. **Geolocation**: Auto-detect user location for initial weather
2. **Dark/Light Mode Toggle**: CSS variable-based theme switching
3. **Unit Preferences**: Toggle between Celsius/Fahrenheit, m/s and mph
4. **Charts**: Visual temperature trends using a charting library
5. **PWA Support**: Offline capability with service workers
6. **E2E Tests**: Playwright tests for critical user flows
7. **Rate Limiting**: Server-side request throttling
8. **Redis Cache**: For distributed deployments
9. **Weather Alerts**: Integration with weather warning APIs
10. **Accessibility Audit**: Full WCAG 2.1 compliance review

## License

MIT
