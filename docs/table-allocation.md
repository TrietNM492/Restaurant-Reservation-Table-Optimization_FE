# Intelligent Table Allocation & Multi-Table Combination

These modules use the existing Seatwise layouts, login store, Axios client and React Query provider.

## Entry points

| User | Module | Route |
| --- | --- | --- |
| Staff / Manager / Admin | Intelligent Table Allocation | `/admin/table-allocation` |
| Staff / Manager / Admin | Multi-Table Combination | `/admin/table-combinations` |
| Customer | Intelligent Table Allocation | `/tables/recommendations` |
| Customer | Multi-Table Combination | `/tables/combinations` |

The staff sidebar has a **Smart seating** group. The customer navbar links to **Smart seating**.
Feature tabs preserve their selection in the URL: `?view=recommendations`, `?view=alternatives`, `?view=optimization`, `?view=allocation` or `?view=scoring`, depending on the module. Optimization is available in the staff workspace.

## Backend integration

- `GET /tables/floor-plan`: area choices available to authenticated accounts, without using admin-only area APIs.
- `POST /tables/recommendations`: recommendations for guest count, start time, duration, soft area preference and combination settings.
- `POST /tables/recommendations/alternatives`: always requests flexible alternatives with their actual start/end time, duration change, convenience and overall score.
- `POST /tables/allocation-optimization/preview`: read-only metrics and proposed reservation moves. STAFF, MANAGER and ADMIN may preview.
- `POST /tables/allocation-optimization/apply`: MANAGER and ADMIN only; requires confirmation after preview. The server recalculates the plan, so the applied result can differ from the preview.
- `POST /reservations`: CUSTOMER only. Sends the selected recommendation's entire `tableIds` list, returned `suggestedPartySize` and exact selected slot. Alternative bookings use the alternative's timestamps.

All paths are relative to the existing Axios `VITE_API_URL`, normally `http://localhost:8080/api/v1`.
Datetime inputs use the browser's local timezone and serialize to UTC ISO instants. Blank start time requests a walk-in recommendation; reservation creation still requires a future start time, as enforced by BE.

Changing search inputs clears old recommendations. Changing optimization scope clears the preview. After a failed apply, a new preview is required; after a booking, a new search is required. Mutation requests are never retried automatically.

## Combination behavior and scoring

BE has no dedicated combination-only endpoint. The combination module requests `allowCombination: true, maxResults: 10` from recommendations and filters `TABLE_COMBINATION` while preserving server ranking. BE prioritizes single tables and only fills remaining result slots with combinations. An empty combination list therefore does not mean the restaurant has no availability. Combinations normally contain up to three tables from one area; the backend's `MORE_TABLES` alternatives can extend this to five.

The scoring tab displays the backend's total score, reasons and component breakdown. Without an area preference, weights are capacity fit 70% and schedule packing 30%. With a preference, weights are 55%, 25% and area match 20%. Capacity fit includes the backend's linear penalty of 12% per extra table. Displayed components are already rounded, so reconstructing the exact total from them may differ slightly. FE does not implement its own ranking algorithm.

## Validation

```powershell
npm run test:allocation
npm run test:allocation:browser
npm run test:menu
npm run build
```

Unit tests cover DTO boundaries, timezone conversion, optimization-window limits, role permissions, booking IDs and alternative timestamps. The browser smoke test follows the existing menu test's Node/Chrome pattern and uses in-memory API fixtures, without real bookings or reservation changes. It covers all five features, error/retry paths, stale-result clearing, confirmation/cancellation, permissions, mobile overflow and runtime exceptions. Screenshots are written under ignored `test-output/`.

The browser test needs installed Chrome; set `CHROME_PATH` if it is not at the default Windows location. It uses local ports 4176 and 9228. Live integration testing still needs the backend, its database/Redis and accounts with the relevant authorities.
