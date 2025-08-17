# Core+ Release Notes

## 2025-08-16 — UI Overhaul Checkpoint
Tag: `checkpoint/ui-overhaul-2025-08-16`

### Highlights
- Bottom navigation: 4 tabs (Home, Workouts, Nutrition, Account) with Ionicons.
- Dashboard
  - Weekly workout streak header.
  - Slide-to-start workout with improved contrast using safe Animated interpolations.
  - Weekly progress calendar.
  - Apple Health–style Activity Rings (workout, water, calories).
  - Unified ScrollView and consistent spacing.
- Nutrition
  - Hero “Daily intake” card with circular gauge.
  - Macro bars for Carbs, Proteins, Fats.
  - Meal rows with “+ Add” action pills.

### Stability & Fixes
- Removed any direct reads of Animated internal values (e.g., `._value`).
- Clamped progress values and added NaN guards for SVG calculations.
- Kept animations strictly via `interpolate`; no object mutations.

### Notes
- Expo suggests aligning versions for Async Storage and react-native-svg later.
- This tag is a safe restore point for the UI overhaul.

### How to try
- Start Expo and switch tabs. If UI doesn’t reflect changes immediately, reload or run with cache clear (`expo start -c`).
