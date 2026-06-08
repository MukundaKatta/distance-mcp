import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { haversine, bearing } from '../src/server.js';

// NYC: 40.7128 N, 74.0060 W. LAX: 33.9416 N, 118.4085 W.
// Known great-circle distance: ~3936 km, 3944 km in some references.
test('NYC → LAX is ~3940 km', () => {
  const d = haversine(40.7128, -74.0060, 33.9416, -118.4085);
  assert.ok(Math.abs(d - 3940) < 30, `got ${d}`);
});

test('distance to self is zero', () => {
  assert.equal(haversine(0, 0, 0, 0), 0);
});

test('antipodes ~ half circumference', () => {
  // 0,0 → 0, 180 → ~20015 km half circumference
  const d = haversine(0, 0, 0, 180);
  assert.ok(Math.abs(d - 20015) < 5);
});

test('unit conversion: km vs mi', () => {
  const km = haversine(0, 0, 0, 1, 'km');
  const mi = haversine(0, 0, 0, 1, 'mi');
  assert.ok(Math.abs(mi - km * 0.621371) < 0.01);
});

test('bearing due north', () => {
  // From equator at 0,0 to 1,0 should be ~0 (north).
  const b = bearing(0, 0, 1, 0);
  assert.ok(Math.abs(b - 0) < 0.001);
});

test('bearing due east', () => {
  // From 0,0 to 0,1 should be 90 (east).
  const b = bearing(0, 0, 0, 1);
  assert.ok(Math.abs(b - 90) < 0.001);
});

test('bearing wraps to [0, 360)', () => {
  // From 0,0 to 0,-1 should be 270 (west).
  const b = bearing(0, 0, 0, -1);
  assert.ok(Math.abs(b - 270) < 0.001);
});

test('unit conversions: m and nm', () => {
  const km = haversine(0, 0, 0, 1, 'km');
  assert.ok(Math.abs(haversine(0, 0, 0, 1, 'm') - km * 1000) < 1e-6);
  assert.ok(Math.abs(haversine(0, 0, 0, 1, 'nm') - km * 0.539957) < 1e-6);
});

test('haversine rejects unknown unit', () => {
  // MCP clients pass untyped args; an unsupported unit must error, not
  // silently return undefined.
  assert.throws(() => haversine(0, 0, 0, 1, 'furlong' as unknown as never), /unknown unit/);
});

test('haversine rejects non-finite coordinates', () => {
  assert.throws(() => haversine(NaN, 0, 0, 1), /finite number/);
  assert.throws(() => haversine(0, Infinity, 0, 1), /finite number/);
});

test('bearing rejects non-finite coordinates', () => {
  assert.throws(() => bearing(0, 0, NaN, 1), /finite number/);
});
