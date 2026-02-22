# HTTP Client

Gyxer includes a built-in Postman-like HTTP client for testing your generated API endpoints.

## Accessing the HTTP Client

Switch to the **HTTP** tab in the right panel (next to the Schema tab). The panel widens to 480px for comfortable editing.

## Components

### Endpoint Picker

A dropdown at the top auto-generates endpoints from your entities:

For each entity (e.g., `Product`):
- `POST /products` — create
- `GET /products` — list all
- `GET /products/1` — get by ID
- `PATCH /products/1` — update
- `DELETE /products/1` — delete

When **Auth JWT** is enabled, additional endpoints appear:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/profile`

Selecting an endpoint pre-fills the method, path, and body template.

### Request Builder

- **Base URL** — configurable, defaults to `http://localhost:3000`, persisted to localStorage
- **Method** — GET, POST, PATCH, PUT, DELETE (color-coded)
- **Path** — endpoint path (e.g., `/products`)
- **Headers** — key-value pairs with enable/disable toggle
- **Body** — JSON editor (visible for POST, PATCH, PUT)

### Response Viewer

After sending a request:

- **Status** — color-coded badge (green for 2xx, orange for 4xx, red for 5xx)
- **Time** — response time in milliseconds
- **Body** — pretty-printed JSON

### Request History

Collapsible section at the bottom showing the last 50 requests:

- Method badge + path + status + timestamp
- Click any entry to replay it
- Clear button to reset history

## CORS Note

The HTTP client runs in the browser, so CORS rules apply. If you get a CORS error:

1. Make sure your NestJS server is running
2. Ensure `enableCors: true` in your project settings (enabled by default)
3. The generated `main.ts` includes `app.enableCors()`

## State

- **Base URL** and **history** are persisted to localStorage
- **Active request** and **response** are session-only
