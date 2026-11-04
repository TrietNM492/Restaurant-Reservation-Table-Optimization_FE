# Menu management frontend

This module uses the Java backend's existing `/api/v1` endpoints. It does not use restaurant demo data as a fallback.

## Run locally

```sh
npm ci
npm run dev
```

The API defaults to `http://localhost:8080/api/v1`. To use a different backend, set `VITE_API_URL` in `.env.local` and restart Vite. The Java backend must allow the frontend origin in its CORS configuration.

## Routes

| Route | Access | Features |
| --- | --- | --- |
| `/admin/menu-categories` | Admin | Search, pagination, sort, create, edit, delete empty categories |
| `/admin/menu-items` | Admin | Search, category/status filters, sort, pagination, create, edit, availability, archive, restore |
| `/menus` | Public | Category navigation, search, price range, sort, page size, pagination |
| `/menus/:id` | Public | Dish detail dialog, including direct links and unavailable dishes |

Admin pages are available from the sidebar and, for administrator accounts, the public navbar. Guests are redirected to login and returned to the requested admin page after signing in. The UI reads `ROLE_ADMIN` from the access token's `permissions` claim; authorization is still enforced by the backend.

## Backend behavior reflected in the UI

- Admin requests use zero-based `page`; public requests use one-based `page`.
- The dedicated service unwraps only the outer `data` envelope, preserving `{ result, meta }`.
- Admin category selectors load every page, including empty categories.
- Category counts include archived items. Deletion is disabled until the category is empty.
- Item DELETE archives the item. Status PATCH can restore it to AVAILABLE.
- Public browsing includes OUT_OF_STOCK items with `available: false`; ARCHIVED items are hidden.
- Public requests omit bearer tokens and do not trigger authentication refresh or login redirects.
- Prices are displayed in VND. Preparation time is submitted in whole minutes.
- Optional fields are explicitly sent as null when cleared. Existing origin IDs are preserved when editing.
- Search, category, prices, sort, page, and size are stored in public URL query parameters. Opening and closing dish details preserves these filters.
- Successful mutations invalidate menu queries, including public categories and their counts.

## Existing API limitations

- Images and category QR references are strings. The form accepts image URLs; there is no menu image upload or QR generation endpoint.
- There is no food-origin lookup endpoint. The editor preserves an existing origin and displays its name, but does not offer changing origins or creating new ones.
- `ConflictException` currently has no global exception handler in the backend. Duplicate names/codes and concurrent attempts to delete a nonempty category may return a generic server error instead of HTTP 409. The frontend displays the error without pretending the save succeeded.
- Browsing does not add ordering/cart features.

## Verification

```sh
npm run build
npm run lint
npm run test:menu
npm run test:menu:browser
```

`test:menu` uses Node's test runner. `test:menu:browser` uses Node 22+ and Chrome headless, with an in-memory API fixture; it never writes to the real backend. Set `CHROME_PATH` if Chrome is not installed at the default Windows path. It uses ports 4175 and 9227, writes screenshots to `test-output/`, and cleans up its temporary browser profile.

The browser suite covers category CRUD, nonempty category deletion, item creation/editing, origin preservation, archive/restore, zero-valued prices/time, public search/details, price validation, missing items, API errors/retry, guest access, authorization, and mobile overflow.

Live integration still requires running the Java service and an activated administrator account.
