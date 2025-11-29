# SparkLabs Mobile Design Guidelines

## Design System Foundation

### Color Palette
**Primary (Brand Purple)**
- Primary-500: #8B5CF6 (main brand color)
- Primary-600: #7C3AED (pressed states)
- Primary-50: #F5F3FF (subtle backgrounds)

**Functional Colors**
- Success-500: #10B981 (growth, positive metrics)
- Warning-500: #F59E0B (revenue, important alerts)
- Error-500: #EF4444 (errors, negative trends)
- Neutral-900: #171717 (primary text)
- Neutral-600: #525252 (secondary text)
- Neutral-50: #FAFAFA (backgrounds)

### Typography
**Font**: System font stack (SF Pro on iOS, Roboto on Android)

**Scale**:
- Display: 34px, Bold (Hero headlines, onboarding)
- Title 1: 28px, Bold (Screen titles)
- Title 2: 22px, Bold (Section headers)
- Title 3: 20px, Semibold (Card titles)
- Body: 17px, Regular (Primary content)
- Callout: 16px, Regular (Secondary content)
- Subhead: 15px, Regular (Metadata)
- Caption: 12px, Regular (Labels, timestamps)

### Spacing & Layout
**8pt Grid System**: All spacing in multiples of 4px
- xs: 4px
- sm: 8px  
- md: 12px
- base: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

**Safe Areas**: 
- Top: 44px (status bar) + 16px padding = 60px total
- Bottom: 34px (home indicator) + 16px padding = 50px total
- Sides: 16px minimum padding

## Navigation Architecture

### Tab Bar Navigation (Primary)
- **Position**: Bottom of screen, fixed
- **Height**: 50px + safe area inset
- **Background**: White (light mode), Neutral-900 (dark mode)
- **Shadow**: Subtle elevation (iOS), 8dp elevation (Android)
- **Tab Count**: 4 tabs maximum
  1. **Dashboard** (Home icon)
  2. **Studio** (Camera icon) 
  3. **Analytics** (BarChart icon)
  4. **Profile** (User icon)

### Screen Headers
- **Default**: Transparent background, large title
- **Scrolled**: Solid background, compact title with shadow
- **Height**: 44px (compact), 96px (large)
- **Title**: Left-aligned, Bold
- **Buttons**: System icons (SF Symbols/Material), 44×44px tap targets

## Screen Specifications

### Dashboard Screen
**Layout**: Scrollable vertical list
- Header: Transparent, large title "Dashboard"
- KPI Cards: 2-column grid, 16px gap
- Platform Cards: Full-width list, 8px vertical spacing
- Safe Areas: Top inset + 16px, Bottom inset + tab bar height + 16px

**KPI Card Design**:
- Size: Flexible width, 120px height
- Background: White, 12px corner radius
- Shadow: Subtle (iOS elevation 2, Android 4dp)
- Icon: 40×40px container, colored background, 24×24px icon
- Metric: 24px Bold, neutral-900
- Label: 14px Regular, neutral-600
- Trend: Success-500 with arrow icon

### Content Studio Screen
**Layout**: Multi-step form, scrollable
- Header: Solid background, title "Create Content", Cancel/Next buttons
- Media Preview: Aspect-video (16:9), 12px corners, full-width minus 32px
- Input Fields: Full-width, 44px height, 8px corners
- Platform Chips: Horizontal scroll, 8px spacing
- Submit Button: Fixed bottom with safe area inset

**Platform Chip Design**:
- Active: Primary-500 background, white text
- Inactive: Neutral-100 background, neutral-700 text  
- Size: 32px height, 12px horizontal padding
- Corners: 8px radius

### Analytics Screen
**Layout**: Scrollable with sticky filters
- Header: Transparent to solid on scroll
- Filter Bar: Sticky below header, horizontal scroll tabs
- Time Range Selector: Segmented control (7d/30d/90d)
- Charts: Full-width cards, 16px margin
- Metric Lists: Grouped sections with headers

**Chart Card Design**:
- Background: White, 16px corner radius
- Padding: 16px
- Title: 20px Semibold
- Chart Height: 200px minimum
- Shadow: Medium elevation

## Component Design

### Primary Button
- Height: 50px (comfortable touch target)
- Corners: 12px radius
- Background: Gradient Primary-500 to Primary-600
- Text: White, 17px Semibold
- Press State: Scale 0.98, opacity 0.9
- Disabled: Neutral-200 background, neutral-400 text

### Secondary Button
- Height: 50px
- Corners: 12px radius
- Background: White with 2px Primary-500 border
- Text: Primary-500, 17px Semibold
- Press State: Primary-50 background

### Input Field
- Height: 44px minimum
- Corners: 8px radius
- Border: 1px Neutral-200
- Focus: 2px Primary-500 ring, border transparent
- Font: 17px Regular
- Placeholder: Neutral-400

### Card Component
- Background: White (light), Neutral-800 (dark)
- Corners: 12px radius
- Padding: 16px
- Shadow: Subtle elevation
- Press State: Slight lift animation (2px) with increased shadow

### Avatar/Profile Image
- Sizes: 32px (small), 40px (default), 64px (large)
- Shape: Circle (full rounded)
- Border: 2px white overlay on colored backgrounds
- Placeholder: Gradient background with Sparkles icon

## Platform-Specific Patterns

### iOS
- Use SF Symbols for icons
- Haptic feedback on button presses and important actions
- Pull-to-refresh with native iOS spinner
- Swipe gestures for delete/archive actions
- Context menus on long-press
- Native date/time pickers
- Translucent navigation bars when appropriate

### Android  
- Use Material icons
- Floating Action Button for primary create action (bottom-right, 56×56dp)
- Material ripple effect on touchable elements
- Snackbar for temporary notifications
- Bottom sheets for secondary actions
- Material date/time pickers
- Standard elevation system (2dp, 4dp, 8dp, 16dp)

## Interaction & Animation

### Transitions
- Screen transitions: 300ms ease-out
- Card entry animations: Slide-up with 100ms stagger
- Micro-interactions: 150ms ease-out
- Loading states: Skeleton screens (subtle pulse)

### Touch Feedback
- Minimum tap target: 44×44px
- Visual feedback: Scale 0.98 or opacity 0.7
- Haptics: Light impact on button press, success/error patterns

### Gestures
- Pull-to-refresh: Dashboard and Analytics screens
- Swipe-to-delete: Content items, scheduled posts
- Pinch-to-zoom: Image preview
- Long-press: Context menus on content cards

## Accessibility

### Requirements
- Color contrast: Minimum 4.5:1 for text, 3:1 for UI components
- Dynamic Type: Support system font scaling
- VoiceOver/TalkBack: All interactive elements labeled
- Touch targets: Minimum 44×44px
- Focus indicators: 2px Primary-500 ring
- Reduce Motion: Respect system preference, use crossfades

### Dark Mode
- Auto-switch based on system preference
- Backgrounds: Neutral-900 (base), Neutral-800 (elevated)
- Text: White (primary), Neutral-300 (secondary)
- Cards: Neutral-800 with subtle elevation
- Maintain brand colors for Primary, Success, Warning, Error

## Content & Media

### Image Handling
- Aspect ratios: Support 1:1, 4:5, 16:9, 9:16
- Max file size: 50MB
- Lazy loading: Images below fold
- Placeholder: Gradient background during load
- Error state: Icon with retry option

### Empty States
- Icon: 64×64px, Neutral-300
- Title: 20px Semibold, Neutral-900
- Description: 15px Regular, Neutral-600
- CTA Button: Primary style, centered

### Loading States
- Full-screen: Spinner centered with logo
- Inline: Skeleton screens matching content structure
- Buttons: Spinner replacing text, disabled state
- Infinite scroll: Footer spinner

## Notifications & Alerts

### Push Notifications
- Title: Platform name + action (e.g., "Instagram Published")
- Body: Content preview + metric
- Icon: Platform-specific icon
- Tap action: Deep link to relevant screen

### In-App Alerts
- Success: Toast at top, Success-500 background, 3s duration
- Error: Modal with dismiss button, Error-500 accent
- Info: Toast at bottom, Primary-500 background
- Warning: Banner at top, Warning-500 background

### Status Indicators
- Live/Active: Pulsing green dot (8px, Success-500)
- Processing: Spinning loader (16px)
- Error: Red exclamation (Error-500)
- Draft: Gray dot (Neutral-400)