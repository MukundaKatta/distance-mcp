#!/usr/bin/env node
/**
 * distance MCP server. Two tools: `haversine`, `bearing`.
 *
 * Great-circle distance between two lat/lon points using the haversine
 * formula. Default radius is the Earth's mean radius (6371 km). `bearing`
 * returns the initial compass bearing in degrees (0=N, 90=E).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const VERSION = '0.1.0';

const RADIUS_KM = 6371;

export type Unit = 'km' | 'm' | 'mi' | 'nm';

function deg2rad(d: number): number { return (d * Math.PI) / 180; }
function rad2deg(r: number): number { return (r * 180) / Math.PI; }

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number, unit: Unit = 'km'): number {
  const phi1 = deg2rad(lat1);
  const phi2 = deg2rad(lat2);
  const dPhi = deg2rad(lat2 - lat1);
  const dLambda = deg2rad(lon2 - lon1);
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = RADIUS_KM * c;
  switch (unit) {
    case 'km': return km;
    case 'm': return km * 1000;
    case 'mi': return km * 0.621371;
    case 'nm': return km * 0.539957;
  }
}

export function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = deg2rad(lat1);
  const phi2 = deg2rad(lat2);
  const dLambda = deg2rad(lon2 - lon1);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  const theta = Math.atan2(y, x);
  return (rad2deg(theta) + 360) % 360;
}

const server = new Server({ name: 'distance', version: VERSION }, { capabilities: { tools: {} } });

const TOOLS = [
  {
    name: 'haversine',
    description: 'Great-circle distance between two lat/lon coordinates. unit: km, m, mi, or nm.',
    inputSchema: {
      type: 'object',
      properties: {
        lat1: { type: 'number' }, lon1: { type: 'number' },
        lat2: { type: 'number' }, lon2: { type: 'number' },
        unit: { type: 'string', enum: ['km', 'm', 'mi', 'nm'], default: 'km' },
      },
      required: ['lat1', 'lon1', 'lat2', 'lon2'],
    },
  },
  {
    name: 'bearing',
    description: 'Initial compass bearing in degrees (0=N, 90=E) from point 1 to point 2.',
    inputSchema: {
      type: 'object',
      properties: {
        lat1: { type: 'number' }, lon1: { type: 'number' },
        lat2: { type: 'number' }, lon2: { type: 'number' },
      },
      required: ['lat1', 'lon1', 'lat2', 'lon2'],
    },
  },
] as const;

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    const a = args as unknown as { lat1: number; lon1: number; lat2: number; lon2: number; unit?: Unit };
    if (name === 'haversine') {
      return jsonResult({ distance: haversine(a.lat1, a.lon1, a.lat2, a.lon2, a.unit ?? 'km'), unit: a.unit ?? 'km' });
    }
    if (name === 'bearing') {
      return jsonResult({ bearing: bearing(a.lat1, a.lon1, a.lat2, a.lon2) });
    }
    return errorResult('unknown tool: ' + name);
  } catch (err) {
    return errorResult('distance failed: ' + (err as Error).message);
  }
});

function jsonResult(value: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
function errorResult(message: string) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`distance MCP server v${VERSION} ready on stdio\n`);
}
