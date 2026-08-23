---
name: Cyber Glass Evolved
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1b1b1d'
  surface-container: '#1f1f21'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#c4c6d0'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#303032'
  outline: '#8e909a'
  outline-variant: '#44474f'
  surface-tint: '#adc6ff'
  primary: '#d8e2ff'
  on-primary: '#122f5f'
  primary-container: '#adc6ff'
  on-primary-container: '#385283'
  inverse-primary: '#455e90'
  secondary: '#ddb7ff'
  on-secondary: '#40215e'
  secondary-container: '#583876'
  on-secondary-container: '#cba6ed'
  tertiary: '#6ffbbe'
  on-tertiary: '#003824'
  tertiary-container: '#4edea3'
  on-tertiary-container: '#005f40'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#2c4677'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2a0848'
  on-secondary-fixed-variant: '#583876'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005236'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
  obsidian-base: '#0e0e10'
  sapphire-glow: '#3b82f6'
  amethyst-glow: '#a855f7'
  emerald-glow: '#10b981'
  glass-edge: rgba(255, 255, 255, 0.15)
  glass-reflection: rgba(255, 255, 255, 0.05)
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  title-md:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-base:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.1em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  code-xs:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  panel-padding: 24px
  container-max: 1440px
---

## Brand & Style

This design system is a high-fidelity, futuristic interface designed for deep immersion in technical environments like cybersecurity and cryptography. The aesthetic is defined by an evolved **Glassmorphism** style that prioritizes physical depth, light refraction, and luminous energy. 

The environment should feel like a multi-layered digital cockpit. By utilizing deep translucency and high-saturation backdrop blurs, the UI evokes a sense of looking through precision-engineered synthetic crystal. The emotional response is one of sophisticated security, hyper-modernity, and tactical clarity. The contrast between the dark obsidian foundation and the vibrant, refracted glows of sapphire and amethyst creates a "digital vault" atmosphere that is both protective and cutting-edge.

## Colors

The palette is optimized for a **Dark Mode** environment, where depth is created through light emission rather than surface pigment.

- **Primary (Sapphire):** Used for active pathways and encryption states. Its glow should feel like it is radiating from beneath the glass surfaces.
- **Secondary (Amethyst):** Reserved for decryption, retrieval, and sensitive asset management.
- **Tertiary (Emerald):** Denotes system integrity and successful forensic audits.
- **Neutral:** A deep obsidian base that provides the necessary contrast for the glass refraction effects.

To achieve the "Cyber Glass" look, use semi-transparent fills for all surfaces (ranging from 4% to 12% opacity) to allow the saturated accent glows from the background to bleed through the frosted layers.

## Typography

This system utilizes a tactical dual-font hierarchy. **Outfit** handles the primary interface narrative, providing a clean, geometric structure that remains legible even against complex blurred backgrounds. 

**JetBrains Mono** is the functional workhorse for all data-heavy technical strings. For forensic labels and status indicators, use the `label-caps` style; the increased letter spacing ensures readability through heavy backdrop blurs. All numerical data, hash values, and logs must strictly use the monospaced font family to maintain grid alignment and a technical "terminal" feel.

## Layout & Spacing

The layout is a **Fluid Grid** system designed for high-density information display. Content is organized into discrete glass panels that float above the obsidian base layer.

- **Grid Model:** A 12-column system for desktop, transitioning to 8 columns for tablet and 4 columns for mobile.
- **Rhythm:** A strict 4px baseline grid governs all internal component spacing.
- **Visual Gaps:** Gutters are maintained at 24px to ensure that the "light leaks" and glows from the background remain visible between panels, emphasizing the layered depth.
- **Safe Zones:** Internal padding within glass containers should be a minimum of 24px to prevent content from interfering with the luminous edge treatments.

## Elevation & Depth

Depth is the core differentiator of this system, achieved through four specific techniques:

1.  **High-Saturation Backdrop Blur:** Every glass surface must apply a Gaussian blur between **20px and 40px**. This creates the "frosted" effect and softens background colors into smooth gradients.
2.  **Luminous Edge Borders:** Apply a dual-stroke effect. Use a **0.5px to 1px** solid light border (`glass-edge`) to simulate the physical edge of a glass sheet. On higher elevation layers, add a secondary inner glow using the primary or secondary color at 20% opacity.
3.  **Reflective Overlays:** Every glass panel includes a subtle linear gradient (Top-Left to Bottom-Right) from `glass-reflection` to transparent. This mimics light hitting the surface at an angle.
4.  **Multi-Layered Shadows:** Instead of black shadows, use diffused color-tinted shadows. 
    - *Layer 1:* Tight, low-opacity shadow (4px blur) for grounding.
    - *Layer 2:* Wide, diffused glow (30px-50px blur) using a low-opacity version of the sapphire or amethyst accent to simulate light emission.

## Shapes

The shape language is "Softly Technical," balancing the harshness of a digital terminal with modern UI aesthetics.

- **Primary Radius:** Use 8px (0.5rem) for all standard cards, inputs, and primary containers.
- **Secondary Radius:** Use 16px (1rem) for larger layout sections or nested containers.
- **Tertiary (Pill):** Navigation elements, chips, and status badges use fully rounded (pill-shaped) ends to stand out as interactive or informative nodes within the rectangular grid.

## Components

- **Glass Cards:** The foundational component. Features a 40px backdrop blur, a 1px white border at 15% opacity, and a subtle reflective gradient.
- **Luminous Buttons:** Primary buttons use a vibrant Sapphire-to-Amethyst gradient with a soft outer glow of the same color. Secondary buttons use the "Glass" style with a high-contrast white border.
- **Technical Inputs:** Input fields are slightly darker than the surface layer (12% opacity) to create a "recessed" look. On focus, the border transitions to a solid 1px Sapphire glow.
- **Status Chips:** Small, monospaced text within a pill-shaped container. Each chip includes a 2px "Live" dot that pulses with a 10px glow radius.
- **Data Grids:** Use hairline 0.5px borders for rows. Every second row features a 2% lighter glass tint to aid horizontal scanning without breaking the translucency.
- **Forensic Tooltips:** Sharp-cornered, high-opacity amethyst surfaces that "cut through" the blur of the lower layers to command immediate attention.