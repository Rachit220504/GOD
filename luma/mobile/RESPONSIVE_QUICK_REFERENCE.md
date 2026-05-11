# LUMA Responsive Quick Reference

## 🚀 Getting Started

Import the responsive utilities in any component:

```typescript
import { useResponsiveLayout } from '../utils/responsiveHelpers';
// Or from theme:
import { useResponsiveLayout } from '../constants/theme';
```

## 📱 Basic Usage

### 1. Device Detection
```typescript
const { 
  isTablet, 
  isLargeTablet, 
  isLandscape, 
  isPortrait,
  deviceCategory 
} = useResponsiveLayout();

// Conditionally render
{isTablet && <TabletSidebar />}
{isLandscape ? <LandscapeView /> : <PortraitView />}
```

### 2. Responsive Spacing
```typescript
const { spacing, screenPadding } = useResponsiveLayout();

// Use in styles
<View style={{ padding: screenPadding }}>
  <Card style={{ margin: spacing.lg, padding: spacing.md }} />
</View>
```

### 3. Responsive Typography
```typescript
const { scaledFontSize, mScale } = useResponsiveLayout();

// Accessibility-aware text
<Text style={{ fontSize: scaledFontSize(16) }}>Body text</Text>

// Moderately scaled text (recommended for headers)
<Text style={{ fontSize: mScale(24, 0.35) }}>Heading</Text>
```

### 4. Grid Columns
```typescript
const { storyColumns, phonicsColumns, badgeColumns } = useResponsiveLayout();

// Auto-adjusting grid
<FlatList 
  numColumns={storyColumns} // 1-2 columns
  data={stories}
  renderItem={renderStory}
/>
```

### 5. Content Width Constraints
```typescript
const { contentMaxWidth, readingMaxWidth, centeredContent } = useResponsiveLayout();

// Centered content with max-width
<ScrollView contentContainerStyle={centeredContent}>
  {/* Content will be centered and capped on large screens */}
</ScrollView>

// Or manually
<ScrollView contentContainerStyle={{
  maxWidth: readingMaxWidth, // 680pt on tablets
  alignSelf: 'center',
  width: '100%',
}}>
```

### 6. Percentage-Based Sizing
```typescript
const { wp, hp } = useResponsiveLayout();

// Width percentage
<Image style={{ width: wp(50), height: hp(30) }} />
// Creates 50% width, 30% height element
```

## 🎨 Common Patterns

### Pattern: Responsive Card Grid
```typescript
const { spacing, storyColumns } = useResponsiveLayout();

<FlatList
  numColumns={storyColumns}
  data={stories}
  columnWrapperStyle={{ gap: spacing.md }}
  contentContainerStyle={{ padding: spacing.lg }}
  renderItem={({ item }) => (
    <View style={{ 
      flex: 1 / storyColumns,
      padding: spacing.sm 
    }}>
      <StoryCard story={item} />
    </View>
  )}
/>
```

### Pattern: Orientation-Aware Layout
```typescript
const { isLandscape, ors } = useResponsiveLayout();

// Method 1: Conditional style
<View style={{
  flexDirection: isLandscape ? 'row' : 'column',
  padding: isLandscape ? spacing.lg : spacing.md,
}}>
  <Sidebar />
  <Content />
</View>

// Method 2: Using ors helper
<View style={{
  flexDirection: ors('column', 'row'),
  padding: ors(spacing.md, spacing.lg),
}}>
```

### Pattern: Device-Specific Values
```typescript
const { rs } = useResponsiveLayout();

// Select value based on device category
const padding = rs({
  phone: 16,
  phoneLarge: 20,
  tablet: 32,
  tabletLarge: 48,
});

// In JSX
<Container style={{ padding }} />
```

### Pattern: Responsive Touch Target
```typescript
const { minTouchSize } = useResponsiveLayout();

// Ensures minimum 44pt (phone) or 48pt (tablet)
<TouchableOpacity style={{
  minWidth: minTouchSize,
  minHeight: minTouchSize,
  padding: spacing.md,
}}>
  <Text>Tap me</Text>
</TouchableOpacity>
```

### Pattern: Tab Bar Integration
```typescript
const { tabBarHeight } = useResponsiveLayout();

// Use in navigation
<Tab.Navigator
  screenOptions={{
    tabBarStyle: { height: tabBarHeight },
  }}
/>
```

## 📐 Responsive Values Reference

### Spacing
```typescript
// Phone → Tablet
spacing.xs    // 4 → 6
spacing.sm    // 8 → 10
spacing.md    // 12 → 16
spacing.lg    // 16 → 24
spacing.xl    // 24 → 40
spacing.xxl   // 32 → 56

screenPadding // 16 (phone), 32 (tablet)
```

### Font Sizes (Base)
```typescript
scaledFontSize(12)  // Caption
scaledFontSize(14)  // Small
scaledFontSize(16)  // Body
scaledFontSize(18)  // Large body
scaledFontSize(20)  // Subheading
scaledFontSize(24)  // Heading
scaledFontSize(32)  // Display
```

### Grid Columns
```typescript
// Phone Portrait → Tablet
storyColumns     // 1 → 2
phonicsColumns   // 2 → 3-4
badgeColumns     // 3 → 4-6
```

### Maximum Widths
```typescript
contentMaxWidth   // undefined (phone), 720-900 (tablet)
readingMaxWidth // undefined (phone), 680 (tablet)
formMaxWidth    // undefined (phone), 500 (tablet)
```

## 🎯 Advanced Usage

### Custom Responsive Hook Composition
```typescript
function useMyComponentLayout() {
  const responsive = useResponsiveLayout();
  
  return {
    ...responsive,
    cardWidth: responsive.isTablet ? responsive.wp(45) : responsive.wp(100) - 32,
    showSidebar: responsive.isTablet && responsive.isLandscape,
    columns: responsive.isLargeTablet ? 3 : responsive.isTablet ? 2 : 1,
  };
}
```

### Calculating Custom Grid Columns
```typescript
import { calculateColumns } from '../utils/responsiveHelpers';

const { width, screenPadding } = useResponsiveLayout();
const availableWidth = width - (screenPadding * 2);
const columns = calculateColumns(150, availableWidth, 4);
// Returns optimal columns based on 150pt minimum item width, max 4 columns
```

### Reading Width Optimization
```typescript
import { getOptimalContentWidth } from '../utils/responsiveHelpers';

const { width } = useResponsiveLayout();
const optimalWidth = getOptimalContentWidth(18, width);
// Returns optimal width for 18pt font (60-75 chars per line)
```

## 🧪 Testing Checklist

When building a new responsive component, verify:

- [ ] Works on iPhone SE (small screen)
- [ ] Works on iPhone Pro Max (large screen)
- [ ] Works on iPad mini (small tablet)
- [ ] Works on iPad Pro (large tablet)
- [ ] Portrait orientation works
- [ ] Landscape orientation works
- [ ] Font scaling (accessibility) works
- [ ] Minimum touch targets (44pt) maintained
- [ ] No horizontal scrolling (unless intended)
- [ ] No clipped text or elements

## 🚨 Anti-Patterns to Avoid

### ❌ Don't: Hardcode Dimensions
```typescript
// BAD
const styles = StyleSheet.create({
  card: { width: 200, height: 300 },
  text: { fontSize: 16 },
});
```

### ✅ Do: Use Responsive Values
```typescript
// GOOD
const { wp, spacing, mScale } = useResponsiveLayout();

const styles = StyleSheet.create({
  card: { 
    width: wp(50), 
    padding: spacing.lg 
  },
  text: { 
    fontSize: mScale(16) 
  },
});
```

### ❌ Don't: Use Magic Numbers
```typescript
// BAD
if (width > 768) { /* tablet logic */ }
```

### ✅ Do: Use Named Breakpoints
```typescript
// GOOD
const { isTablet, BREAKPOINTS } = useResponsiveLayout();
if (isTablet) { /* tablet logic */ }
// Or compare against BREAKPOINTS.tablet (768)
```

### ❌ Don't: Ignore Accessibility
```typescript
// BAD
<Text style={{ fontSize: 14 }} />
```

### ✅ Do: Respect OS Font Scaling
```typescript
// GOOD
const { scaledFontSize } = useResponsiveLayout();
<Text style={{ fontSize: scaledFontSize(14) }} />
```

## 📚 Migration Examples

### Before → After: Simple Screen

**Before:**
```typescript
export function MyScreen() {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 16 }}>Title</Text>
      <View style={{ width: 200, height: 100 }} />
    </View>
  );
}
```

**After:**
```typescript
import { useResponsiveLayout } from '../utils/responsiveHelpers';

export function MyScreen() {
  const { spacing, mScale, wp } = useResponsiveLayout();
  
  return (
    <View style={{ flex: 1, padding: spacing.screen }}>
      <Text style={{ fontSize: mScale(16) }}>Title</Text>
      <View style={{ width: wp(60), height: wp(30) }} />
    </View>
  );
}
```

### Before → After: Grid Layout

**Before:**
```typescript
<FlatList
  numColumns={2}
  data={items}
  renderItem={({ item }) => (
    <View style={{ flex: 0.5, padding: 8 }}>
      <Card>{item}</Card>
    </View>
  )}
/>
```

**After:**
```typescript
const { storyColumns, spacing } = useResponsiveLayout();

<FlatList
  numColumns={storyColumns}
  data={items}
  columnWrapperStyle={{ gap: spacing.md }}
  renderItem={({ item }) => (
    <View style={{ 
      flex: 1 / storyColumns,
      padding: spacing.sm 
    }}>
      <Card>{item}</Card>
    </View>
  )}
/>
```

## 🔗 Related Files

- `src/utils/responsiveHelpers.ts` - Core responsive utilities
- `src/utils/responsive.ts` - Original responsive utilities (backward compat)
- `src/components/common/ResponsiveContainer.tsx` - Container components
- `src/constants/theme.ts` - Theme with responsive exports
- `RESPONSIVE_REFACTOR_GUIDE.md` - Full architecture documentation

## 🆘 Need Help?

Common issues and solutions:

**Q: My component doesn't re-render on rotation**
A: Make sure you're using the hook inside the component, not at module level:
```typescript
// Wrong - won't update on rotation
const { width } = Dimensions.get('window');

// Right - re-renders on dimension changes
const { width } = useResponsiveLayout();
```

**Q: Font scaling makes text too large**
A: Use `mScale()` with a smaller factor:
```typescript
const fontSize = mScale(16, 0.2); // Less aggressive scaling
```

**Q: Grid columns not updating on rotation**
A: Ensure FlatList has `key` prop that changes with columns:
```typescript
<FlatList 
  key={storyColumns} // Forces re-render on column change
  numColumns={storyColumns}
/>
```

---

**Last Updated:** 2026-05-11  
**Version:** 1.0
