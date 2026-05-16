# distance-mcp

[![npm](https://img.shields.io/npm/v/@mukundakatta/distance-mcp.svg)](https://www.npmjs.com/package/@mukundakatta/distance-mcp)
[![mcp](https://img.shields.io/badge/protocol-MCP-blue.svg)](https://modelcontextprotocol.io)

MCP server: great-circle distance and initial bearing between two lat/lon
points using the haversine formula. Earth's mean radius (6371 km) assumed.

## Tools

- `haversine` — `{ lat1, lon1, lat2, lon2, unit }` → `{ distance, unit }`. unit ∈ `km|m|mi|nm`.
- `bearing` — initial compass bearing in degrees (0=N, 90=E).

## Configure

```json
{ "mcpServers": { "distance": { "command": "npx", "args": ["-y", "@mukundakatta/distance-mcp"] } } }
```

## License

MIT.
