# TellooS Design System

## Overview
TellooS uses a **neuromorphic design system** inspired by Apple's Siri and Vision Pro interfaces. The design combines soft 3D shadows with colorful glowing accents to create a premium, modern aesthetic that stands apart from typical "AI-generated" UI patterns.

## Core Principles

### 1. Neuromorphic Foundation
- **Raised elements** (`.neuro-raised`): Cards, buttons, and interactive elements appear to float above the surface
- **Inset elements** (`.neuro-inset`): Input fields and containers appear pressed into the surface
- **Soft shadows**: Multi-layered shadows create depth without harsh edges

### 2. Glowing Accents
- **Cyan** (#00d4ff): Primary actions, links, active states
- **Purple** (#a855f7): Secondary actions, premium features
- **Pink** (#ec4899): Tertiary actions, special highlights
- **Teal** (#67e8f9): Accent variations

### 3. Mobile-First Responsive
- Base font: 16px desktop, 14px mobile
- Touch targets: Minimum 44px on mobile
- Safe area insets for notched devices
- Bottom navigation on mobile, sidebar on desktop

## Color System

```css
/* Base Colors */
--background: #ffffff (pure white)
--foreground: #1a1a1a (near black)
--card: #fafbfc (off-white)
--muted: #f5f7fa (light gray)
--border: #e5e7eb (border gray)

/* Accent Colors */
--primary: #00d4ff (cyan)
--secondary: #a855f7 (purple)
--accent: #38bdf8 (sky blue)

/* Glow Colors */
--glow-cyan: #00d4ff
--glow-purple: #a855f7
--glow-pink: #ec4899
--glow-teal: #67e8f9
```

## Typography

### Font Families
- **Sans-serif**: Inter (primary)
- **Monospace**: SF Mono (code, technical)

### Font Sizes
- Mobile base: 14px
- Desktop base: 16px
- Scale: Use Tailwind's default scale (text-sm, text-base, text-lg, etc.)

### Font Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

## Spacing & Layout

### Container Widths
```tsx
.container-responsive {
  max-width: 1440px;
  padding: 1rem (mobile) → 1.5rem (tablet) → 2rem (desktop)
}
```

### Spacing Scale
Use Tailwind's spacing scale consistently:
- `gap-2` (8px), `gap-4` (16px), `gap-6` (24px), `gap-8` (32px)
- `p-4` (16px), `p-6` (24px), `p-8` (32px)
- `mb-4`, `mt-6`, etc.

### Border Radius
- Small: `rounded-xl` (12px) - buttons, small cards
- Medium: `rounded-2xl` (16px) - cards, containers
- Large: `rounded-3xl` (24px) - modals, large cards
- Full: `rounded-full` - avatars, pills

## Component Patterns

### Cards
```tsx
<div className="neuro-raised rounded-2xl p-6 bg-white">
  {/* Content */}
</div>
```

### Primary Buttons
```tsx
<Button className="glow-border-cyan neuro-raised rounded-xl">
  Action
</Button>
```

### Secondary Buttons
```tsx
<Button className="glow-border-purple neuro-raised rounded-xl">
  Action
</Button>
```

### Input Fields
```tsx
<Input className="neuro-inset rounded-xl border-0 bg-muted/30" />
```

### Avatars
```tsx
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
  {/* Avatar content */}
</div>
```

### Post Cards
```tsx
<article className="neuro-raised rounded-2xl overflow-hidden hover:scale-[1.02] transition-all">
  {/* Post content */}
</article>
```

## Utility Classes

### Neuromorphic Effects
- `.neuro-raised` - Elevated 3D effect
- `.neuro-inset` - Depressed 3D effect

### Glow Effects
- `.glow-cyan` - Cyan halo
- `.glow-purple` - Purple halo
- `.glow-pink` - Pink halo
- `.glow-teal` - Teal halo
- `.glow-multi` - Multi-color halo

### Glow Borders
- `.glow-border-cyan` - Cyan glowing border
- `.glow-border-purple` - Purple glowing border
- `.glow-border-pink` - Pink glowing border

### Ambient Glows
- `.ambient-glow-cyan` - Subtle cyan background glow
- `.ambient-glow-purple` - Subtle purple background glow
- `.ambient-glow-pink` - Subtle pink background glow

## Animation & Transitions

### Hover States
```tsx
hover:scale-[1.02] transition-all duration-300
hover:glow-cyan transition-all duration-300
hover:shadow-2xl transition-all duration-300
```

### Active States
```tsx
active:scale-95
```

### Loading States
```tsx
animate-pulse
```

## Page Layout Structure

### Standard Page Layout
```tsx
<div className="min-h-screen bg-white">
  {/* Header - sticky top-0 */}
  <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
    {/* Header content */}
  </header>

  {/* Main Content */}
  <main className="container-responsive py-6">
    {/* Page content */}
  </main>

  {/* Mobile Nav - fixed bottom */}
  <MobileNav user={user} />
</div>
```

### Feed/Grid Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Items */}
</div>
```

### Form Layout
```tsx
<form className="space-y-4">
  <div>
    <Label>Field Label</Label>
    <Input className="neuro-inset rounded-xl mt-1" />
  </div>
</form>
```

## Responsive Breakpoints

```css
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

## Accessibility

### Touch Targets
- Minimum 44px height on mobile
- Adequate spacing between interactive elements

### Color Contrast
- Text on white: #1a1a1a (near black) - WCAG AAA
- White text on colored backgrounds - WCAG AA minimum

### Focus States
- All interactive elements have visible focus rings
- Use `outline-ring/50` for focus outlines

## Best Practices

### DO ✅
- Use neuromorphic effects for cards and buttons
- Apply glowing accents to CTAs and active states
- Maintain consistent spacing using Tailwind scale
- Use rounded corners (xl, 2xl, 3xl)
- Implement smooth transitions (duration-300)
- Follow mobile-first responsive design

### DON'T ❌
- Mix flat design with neuromorphic elements
- Use harsh shadows or borders
- Apply too many glow effects on one screen
- Use colors outside the defined palette
- Create custom spacing values
- Ignore mobile touch target sizes

## Component Checklist

When creating new components, ensure:
- [ ] Uses `.neuro-raised` or `.neuro-inset` appropriately
- [ ] Has proper rounded corners (`rounded-xl/2xl/3xl`)
- [ ] Includes hover/active states with transitions
- [ ] Follows the color palette (cyan/purple/pink/teal)
- [ ] Is mobile-responsive with proper touch targets
- [ ] Has consistent spacing using Tailwind scale
- [ ] Includes loading and error states
- [ ] Maintains accessibility standards

## Examples

### Complete Button Example
```tsx
<Button 
  className="glow-border-cyan neuro-raised rounded-xl px-6 py-3 bg-gradient-to-r from-[#00d4ff] to-[#38bdf8] text-white hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
>
  Primary Action
</Button>
```

### Complete Card Example
```tsx
<div className="neuro-raised rounded-2xl p-6 bg-white hover:glow-multi transition-all duration-300">
  <h3 className="text-lg font-semibold text-foreground mb-2">Card Title</h3>
  <p className="text-muted-foreground">Card description text</p>
</div>
```

### Complete Input Example
```tsx
<div>
  <Label className="text-sm font-medium text-foreground">Label</Label>
  <Input 
    className="neuro-inset rounded-xl border-0 bg-muted/30 focus:glow-cyan transition-all duration-300 mt-1"
    placeholder="Enter text..."
  />
</div>
```

---

**Last Updated**: 2025
**Version**: 1.0
**Maintained by**: TellooS Design Team
