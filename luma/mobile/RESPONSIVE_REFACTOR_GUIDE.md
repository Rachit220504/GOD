# LUMA Mobile App - Responsive Refactor Guide

## Executive Summary

This guide documents the comprehensive responsive architecture implemented for the LUMA mobile app to ensure full responsiveness across:
- All phone sizes (iPhone SE → Pro Max)
- Android devices (small → large)
- Tablets and iPads
- Landscape and portrait orientations
- Foldable devices

## Architecture Overview

### 1. Responsive Utility Layer

**New Files Created:**

#### `src/utils/responsiveHelpers.ts`
The core responsive calculation engine providing:

- **Scaling Functions:**
  - `scale(size, width)` - Linear width-based scaling
  - `vScale(size, height)` - Height-based scaling
  - `mScale(size, factor, width)` - Moderate scaling for fonts
  - `wp(percentage, width)` - Width percentage
  - `hp(percentage, height)` - Height percentage

- **Device Detection:**
  - `getDeviceCategory(width)` - Returns: phone | phoneLarge | tablet | tabletLarge | desktop
  - `isTabletDevice(width)` - Boolean tablet check
  - `isLargeTabletDevice(width)` - Boolean large tablet check
  - `getAspectRatioCategory(width, height)` - Detects screen shape
  - `isLandscapeOrientation(width, height)` - Orientation detection

- **Responsive Value Selectors:**
  - `rs(options, width)` - Select value based on device category
  - `ors(portrait, landscape, width, height)` - Orientation-based selection

- **Layout Calculations:**
  - `calculateColumns(minItemWidth, containerWidth, maxColumns)` - Grid column calculator
  - `getOptimalContentWidth(fontSize, width)` - Reading width optimizer (60-75 chars/line)
  - `getScreenPadding(width)` - Responsive padding
  - `getCardPadding(width)` - Card spacing

- **Hook: `useResponsiveLayout()`**
  Returns comprehensive responsive metrics:
  ```typescript
  const {
    width, height,                    // Current dimensions
    deviceCategory,                    // phone | tablet | etc.
    isTablet, isLargeTablet,
    isLandscape, isPortrait,
    aspectCategory,                    // veryTall | tall | standard | wide | veryWide
    screenPadding,                     // Adaptive padding
    contentMaxWidth,                   // For centered layouts
    readingMaxWidth,                   // Optimal reading width
    storyColumns,                      // 1-2 columns
    phonicsColumns,                    // 2-4 columns
    badgeColumns,                      // 3-6 columns
    spacing,                           // { xs, sm, md, lg, xl, xxl }
    scaledFontSize,                    // OS-aware font scaling
    tabBarHeight,                      // Adaptive tab bar
    minTouchSize,                      // 44-48pt
    // Helper functions
    rs, ors, scale, vScale, mScale, wp, hp,
    centeredContent,                   // Style object
  } = useResponsiveLayout();
  ```

#### `src/components/common/ResponsiveContainer.tsx`
Reusable responsive container components:

- **`<ResponsiveContainer />`** - Adaptive scrollable/full-screen container
- **`<ResponsiveGrid />`** - Auto-column-adjusting grid
- **`<ResponsiveCard />`** - Adaptive card with responsive padding
- **`<ResponsiveText />`** - Font-scaling text component

### 2. Theme System Integration

**Updated `src/constants/theme.ts`:**
- Exports all new responsive helpers
- Maintains backward compatibility with existing `RFontSize`, `RSpacing`
- Enhanced responsive spacing for tablets (+25%)

### 3. Navigation Refactoring

**Updated `src/navigation/MainTabsNavigator.tsx`:**

#### Before (Fixed):
```typescript
const TAB_BAR_HEIGHT = 72; // Fixed
const tabImage = { width: 24, height: 24 }; // Fixed
const tabLabel = { fontSize: 10 }; // Fixed
```

#### After (Responsive):
```typescript
const { isLandscape, isTablet, tabBarHeight, mScale, spacing } = useResponsiveLayout();

// Dynamic values
const iconSize = isTablet ? 28 : isLandscape ? 20 : 24;
const labelSize = mScale(isTablet ? 11 : 10, 0.3);
const itemPadding = isLandscape ? spacing.sm : spacing.md;
const dynamicTabBarHeight = tabBarHeight; // 72-88 based on device
```

**Key Improvements:**
- Tab bar height adapts to device (72pt phone, 88pt tablet)
- Icons scale with device size (20-28pt)
- Labels scale with accessibility settings
- Padding adjusts for landscape
- Touch targets maintain 44-48pt minimum

## Responsive Patterns Implemented

### Pattern 1: Device-Aware Spacing
```typescript
const { spacing, screenPadding } = useResponsiveLayout();

// Use adaptive spacing
<View style={{ padding: screenPadding }}>
  <Card style={{ padding: spacing.lg }} />
</View>
```

### Pattern 2: Responsive Grid Columns
```typescript
const { storyColumns, phonicsColumns } = useResponsiveLayout();

// Stories: 1 column phone, 2 columns tablet
<FlatList numColumns={storyColumns} />

// Phonics: 2-4 columns based on device
<Grid columns={phonicsColumns} />
```

### Pattern 3: Orientation Adaptation
```typescript
const { isLandscape, ors } = useResponsiveLayout();

// Different layouts for portrait vs landscape
<View style={{
  flexDirection: ors('column', 'row'),
  padding: ors(16, 24),
}} />
```

### Pattern 4: Reading Width Optimization
```typescript
const { readingMaxWidth } = useResponsiveLayout();

// Cap text width for readability (65-75 chars/line)
<ScrollView contentContainerStyle={{
  maxWidth: readingMaxWidth,
  alignSelf: 'center',
}} />
```

### Pattern 5: Responsive Typography
```typescript
const { scaledFontSize } = useResponsiveLayout();

// Font scales with device AND respects OS accessibility
<Text style={{ fontSize: scaledFontSize(16) }} />
```

## Screens Requiring Responsive Refactor

### High Priority (Core User Flows)

1. **HomeScreen** (`src/screens/home/HomeScreen.tsx`)
   - Issues: Fixed card sizes, hardcoded grid spacing
   - Fixes needed:
     - Use `storyColumns` for grid
     - Adaptive `SCREEN_PADDING`
     - Responsive typography for headers
     - Flexible weekly calendar strip

2. **ReadingModeScreen** (`src/screens/reading/ReadingModeScreen.tsx`)
   - Issues: Fixed word box sizes, hardcoded reading width
   - Fixes needed:
     - Use `readingMaxWidth` for content
     - Responsive word tap targets (minTouchSize)
     - Adaptive syllable box sizing
     - Landscape: side-by-side controls

3. **GenerateStoryScreen** (`src/screens/home/GenerateStoryScreen.tsx`)
   - Issues: Fixed form width, hardcoded chip sizes
   - Fixes needed:
     - Centered form with max-width
     - Responsive word count chips
     - Tablet: multi-column layout

4. **StoryDetailScreen** (`src/screens/home/StoryDetailScreen.tsx`)
   - Issues: Fixed header height, hardcoded preview sizes
   - Fixes needed:
     - Responsive hero section
     - Adaptive tag chips
     - Tablet: split view layout

### Medium Priority (Progress & Gamification)

5. **MyReadingTreeScreen** (`src/screens/progress/MyReadingTreeScreen.tsx`)
   - Issues: Fixed tree dimensions (200x250), absolute fruit positions
   - Fixes needed:
     - Scale tree with screen size
     - Responsive fruit positioning
     - Tablet: larger tree visualization

6. **MyGrowingPlantScreen** (`src/screens/progress/MyGrowingPlantScreen.tsx`)
   - Issues: Fixed pot/plant sizes
   - Fixes needed:
     - Scale plant with container
     - Responsive growth animation

7. **MyStarGalaxyScreen** (`src/screens/progress/MyStarGalaxyScreen.tsx`)
   - Issues: Fixed star positions, hardcoded galaxy size
   - Fixes needed:
     - Responsive star map
     - Scale constellation display

8. **ReadingJourneyScreen** (`src/screens/progress/ReadingJourneyScreen.tsx`)
   - Issues: Fixed checkpoint positions
   - Fixes needed:
     - Responsive journey path
     - Adaptive checkpoint spacing

### Lower Priority (Supporting Screens)

9. **SettingsScreen** (`src/screens/settings/SettingsScreen.tsx`)
   - Issues: Fixed card widths
   - Fixes needed:
     - Centered content on tablets
     - Responsive font preview

10. **ParentDashboardScreen** (`src/screens/parent/ParentDashboardScreen.tsx`)
    - Issues: Fixed chart sizes
    - Fixes needed:
      - Responsive charts
      - Tablet: dashboard grid

11. **Onboarding Screens** (`src/screens/onboarding/`)
    - Issues: Fixed illustration sizes
    - Fixes needed:
      - Responsive onboarding images
      - Adaptive text sizing

12. **Auth Screens** (`src/screens/auth/`)
    - Issues: Fixed form widths
    - Fixes needed:
      - Centered auth forms
      - Responsive input fields

## Implementation Checklist

### Phase 1: Foundation (COMPLETED)
- [x] Create responsiveHelpers.ts utility layer
- [x] Create ResponsiveContainer components
- [x] Update theme.ts exports
- [x] Refactor MainTabsNavigator

### Phase 2: Core Screens
- [ ] Refactor HomeScreen with responsive grids
- [ ] Refactor ReadingModeScreen with optimized reading width
- [ ] Refactor GenerateStoryScreen with adaptive forms
- [ ] Refactor StoryDetailScreen with responsive hero

### Phase 3: Gamification
- [ ] Refactor MyReadingTreeScreen with scalable tree
- [ ] Refactor MyGrowingPlantScreen with responsive plant
- [ ] Refactor MyStarGalaxyScreen with adaptive star map
- [ ] Refactor ReadingJourneyScreen with responsive path

### Phase 4: Supporting UI
- [ ] Refactor SettingsScreen
- [ ] Refactor ParentDashboardScreen
- [ ] Refactor Onboarding screens
- [ ] Refactor Auth screens

### Phase 5: Testing & Polish
- [ ] Test on iPhone SE (small)
- [ ] Test on iPhone Pro Max (large)
- [ ] Test on iPad mini (small tablet)
- [ ] Test on iPad Pro (large tablet)
- [ ] Test landscape on all devices
- [ ] Verify accessibility font scaling
- [ ] Check minimum touch targets (44pt)

## Key Responsive Values Reference

### Breakpoints
| Device | Width | Classification |
|--------|-------|----------------|
| iPhone SE | 375px | phone |
| iPhone 14 | 390px | phone |
| iPhone Pro Max | 430px | phoneLarge |
| iPad mini | 768px | tablet |
| iPad Air | 820px | tablet |
| iPad Pro 11" | 834px | tablet |
| iPad Pro 12.9" | 1024px | tabletLarge |

### Spacing Scale
| Token | Phone | Tablet |
|-------|-------|--------|
| screen | 16pt | 32pt |
| xs | 4pt | 6pt |
| sm | 8pt | 10pt |
| md | 12pt | 16pt |
| lg | 16pt | 24pt |
| xl | 24pt | 40pt |

### Typography Scale
| Variant | Phone | Tablet |
|---------|-------|--------|
| display | 32pt | 40pt |
| heading | 24pt | 30pt |
| subheading | 20pt | 24pt |
| body | 16pt | 18pt |
| caption | 14pt | 16pt |

### Grid Columns
| Screen | Stories | Phonics | Badges |
|--------|---------|---------|--------|
| Phone Portrait | 1 | 2 | 3 |
| Phone Landscape | 2 | 3 | 4 |
| Tablet | 2 | 3-4 | 4-6 |

## Testing Guide

### Device Testing Matrix
Test these configurations:
1. iPhone SE (375×667) - Small phone
2. iPhone 14 (390×844) - Standard phone
3. iPhone Pro Max (430×932) - Large phone
4. iPad mini (768×1024) - Small tablet portrait
5. iPad mini landscape (1024×768)
6. iPad Pro 12.9" (1024×1366) - Large tablet
7. iPad Pro landscape (1366×1024)

### Accessibility Testing
1. Enable Dynamic Type (Settings > Accessibility > Display & Text Size)
2. Test with 85% font size
3. Test with 100% font size (default)
4. Test with 150% font size
5. Test with 200% font size (maximum)

### Responsive Checks
For each screen, verify:
- [ ] No horizontal scrolling (unless content requires it)
- [ ] No clipped text or elements
- [ ] Minimum 44pt touch targets
- [ ] Balanced spacing on all sides
- [ ] Readable text width (not too wide on tablets)
- [ ] Proper contrast maintained
- [ ] Smooth rotation transitions

## Migration Guide for Existing Components

### Converting Fixed Dimensions

**Before:**
```typescript
const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 250,
    padding: 20,
  },
  text: {
    fontSize: 16,
  },
});
```

**After:**
```typescript
const { spacing, mScale, wp } = useResponsiveLayout();

const styles = StyleSheet.create({
  container: {
    width: wp(60), // 60% of screen width
    height: vScale(250), // Scaled height
    padding: spacing.lg, // Responsive padding
  },
  text: {
    fontSize: mScale(16), // Moderately scaled
  },
});
```

### Converting Device-Specific Logic

**Before:**
```typescript
const isTablet = width > 768;
const padding = isTablet ? 32 : 16;
```

**After:**
```typescript
const { screenPadding, isTablet } = useResponsiveLayout();
// Use screenPadding directly, or:
const padding = isTablet ? spacing.lg : spacing.md;
```

### Converting Grids

**Before:**
```typescript
<FlatList
  numColumns={2}
  columnWrapperStyle={{ gap: 12 }}
/>
```

**After:**
```typescript
const { storyColumns, spacing } = useResponsiveLayout();

<FlatList
  numColumns={storyColumns}
  columnWrapperStyle={{ gap: spacing.md }}
/>
```

## Performance Considerations

1. **Memoization:** `useResponsiveLayout` uses `useMemo` to prevent recalculation
2. **Static Values:** Use `scale()`, `mScale()` for StyleSheet-safe values
3. **Avoid:** Creating new objects in render - use memoized styles
4. **Dimension Listeners:** Hook uses `useWindowDimensions` (built-in optimization)

## Backward Compatibility

All existing code continues to work:
- Original `responsive.ts` exports maintained
- `SCREEN_PADDING`, `TAB_BAR_HEIGHT` still exported
- `RFontSize`, `RSpacing` still available
- Gradual migration path supported

## Future Enhancements

1. **Foldable Support:** Add window size class detection
2. **Desktop Support:** Extend breakpoints for Mac Catalyst
3. **TV Support:** Add TV-optimized spacing (10ft UI)
4. **Watch Support:** Add watch-specific breakpoints

## Resources

- [Apple: Designing for Different Screen Sizes](https://developer.apple.com/design/human-interface-guidelines/layout)
- [Material Design: Responsive Layout](https://m3.material.io/foundations/layout/understanding-layout/overview)
- [React Native: Dimensions](https://reactnative.dev/docs/dimensions)
- [WCAG: Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-11  
**Status:** Phase 1 Complete, Phases 2-5 In Progress
