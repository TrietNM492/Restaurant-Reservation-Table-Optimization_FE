# PROMPT — ESTABLISH A PRODUCTION-GRADE PURPLE DESIGN SYSTEM WITH MUI

Act as a Senior Product Designer and Senior React Frontend Engineer specializing in design systems, Material UI, accessibility, and production-grade hospitality platforms.

## Project Context

Project: Intelligent Restaurant Reservation & Table Management.

Frontend stack:
- React 19
- JavaScript (ES6+)
- Vite
- Material UI (MUI)
- MUI Icons

The product includes customer-facing pages such as the landing page, restaurant discovery, restaurant details, reservation forms, and customer account pages. It may also include administrative pages with tables, filters, pagination, forms, and dashboards.

## Objective

Establish a coherent, reusable, production-inspired purple design system and apply it consistently across the existing UI.

Do not simply replace every color with purple.

Use purple as the brand color while preserving visual hierarchy, readability, meaningful status colors, and a premium hospitality experience.

## 1. Brand Direction

Use a Modern Violet visual identity.

Core colors:
- Primary: #6D28D9
- Primary hover: #5B21B6
- Primary light: #8B5CF6
- Secondary lavender: #A78BFA
- Brand surface: #F5F3FF
- Heading text: #1E1B2E
- Body text: #64748B
- Main background: #FFFFFF
- Subtle background: #F8FAFC
- Border: #E2E8F0

Semantic colors:
- Success: #16A34A
- Warning: #D97706
- Error: #DC2626
- Information: #2563EB

Keep the design clean, elegant, welcoming, and modern.

## 2. Design Principles

- Establish a consistent color hierarchy.
- Use neutral backgrounds for most content.
- Reserve strong purple for primary actions, selected states, active navigation, and important interactive elements.
- Use pale lavender for selected surfaces and subtle emphasis.
- Keep text readable and maintain sufficient contrast.
- Use a consistent spacing scale based on 8px.
- Standardize border radii, typography, component heights, and shadows.
- Avoid excessive gradients, neon effects, and unnecessary decoration.
- Preserve natural restaurant photography and warm food imagery.
- Avoid making every card, icon, section, and button purple.

## 3. Centralized MUI Theme

Inspect the installed MUI version and the existing project architecture before modifying files.

Create or improve a centralized theme using `createTheme()` and `ThemeProvider`.

Configure:
- Palette.
- Typography.
- Shape and border radius.
- Button variants.
- Text field focus states.
- Card and Paper surfaces.
- Menu selected and hover states.
- Table headers and row interactions.
- Pagination selected states.
- Alert and Chip semantic colors.
- Consistent component spacing and dimensions.

Use `sx`, `styled()`, and MUI theme overrides appropriately.

Do not duplicate brand colors across unrelated components when they can be defined centrally.

Do not override every MUI default unnecessarily.

## 4. Component Styling Requirements

### Buttons
- Primary contained buttons use purple with white text.
- Secondary outlined buttons use neutral backgrounds and subtle purple borders.
- Text buttons use restrained brand coloring.
- Provide clear hover, focus, disabled, and loading states.
- Avoid excessive shadows.

### Forms
- White input backgrounds.
- Neutral borders by default.
- Purple borders and focus rings when focused.
- Consistent input heights and border radii.
- Accessible labels and readable validation messages.
- Red for errors and green for success where appropriate.

### Navigation and Menus
- White navigation background.
- Subtle dividers.
- Pale lavender selected states.
- Purple text or icons for active items.
- Responsive mobile navigation.
- Avoid unnecessary dark-purple surfaces.

### Cards
- White surfaces.
- Consistent border radius and padding.
- Subtle borders and shadows.
- Purple reserved for meaningful labels and actions.
- Restaurant imagery should remain natural and visually prominent.

### Tables and Pagination
- Neutral table headers.
- Subtle row hover states.
- Pale lavender for selected rows when appropriate.
- Purple for the active pagination page.
- Semantic status chips.
- Clear search, filter, and toolbar hierarchy.

### Dialogs, Alerts, and Notifications
- Neutral dialog surfaces.
- Clear title and action hierarchy.
- Semantic colors for success, warning, error, and information.
- Consistent button placement.

### Landing Page
- Premium, image-driven restaurant presentation.
- Strong typography.
- Purple primary CTAs.
- Neutral sections with occasional lavender backgrounds.
- A prominent and easy-to-use reservation search component.

## 5. Customer and Admin Visual Distinction

Customer-facing pages should feel welcoming, image-driven, and conversion-focused.

Administrative pages should prioritize information density, clarity, scanning speed, and efficient operations.

Both should share the same brand tokens while using different layout patterns appropriate to their purposes.

Do not force customer-facing layouts and administrative layouts to look identical.

## 6. Architecture and Implementation

- Inspect existing files before editing.
- Reuse existing components, routes, and theme infrastructure.
- Create reusable shared components where appropriate.
- Prefer MUI components over custom implementations of functionality MUI already provides.
- Keep data and presentation concerns separate.
- Preserve existing business logic and API integrations.
- Do not introduce unrelated dependencies.
- Use JavaScript, not TypeScript, unless the existing project requires otherwise.

## 7. Accessibility and Quality Assurance

- Verify contrast for text, interactive controls, and focus indicators.
- Ensure keyboard navigation works.
- Do not communicate status through color alone.
- Check responsive layouts.
- Verify buttons and links have appropriate states.
- Ensure there is no horizontal overflow.
- Confirm the project compiles after changes.

## Deliverables

1. A centralized MUI theme.
2. Reusable and consistent component styling.
3. Updated relevant pages and shared components.
4. A short explanation of the color system and component decisions.
5. A list of modified files.
6. Any required setup instructions.
7. A summary of responsive and accessibility checks performed.

Prioritize consistency, maintainability, accessibility, and real product usability over visual decoration.

Before making changes, inspect the existing codebase and explain the implementation plan briefly. Then implement the changes using the established project architecture.