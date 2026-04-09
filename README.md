# Derby Digital Onboarding Portal

Client onboarding wizard for Derby Digital. Built with Next.js 14, Tailwind CSS, and Supabase.

## Embedding on WordPress

The onboarding wizard can be embedded on any page via iframe. An embed script handles iframe creation, auto-height resizing, and event callbacks.

### Quick Setup

Add this to your WordPress page (HTML block or custom template):

```html
<div id="derby-onboarding"></div>
<script src="https://onboarding.derbydigital.us/embed.js"></script>
<script>
  DerbyOnboarding.init({
    container: '#derby-onboarding',
    baseUrl: 'https://onboarding.derbydigital.us'
  });
</script>
```

### Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `container` | `string \| Element` | Yes | CSS selector or DOM element to render into |
| `baseUrl` | `string` | No | Base URL of the onboarding app. Auto-detected from script src if omitted |
| `onStepChange` | `function` | No | Callback on step navigation. Receives `{ step, totalSteps, completionPercent }` |
| `onComplete` | `function` | No | Callback when the user completes the wizard |

### Example with Callbacks

```html
<div id="derby-onboarding"></div>
<script src="https://onboarding.derbydigital.us/embed.js"></script>
<script>
  DerbyOnboarding.init({
    container: '#derby-onboarding',
    baseUrl: 'https://onboarding.derbydigital.us',
    onStepChange: function(data) {
      console.log('Step', data.step, 'of', data.totalSteps);
    },
    onComplete: function() {
      console.log('Onboarding complete!');
    }
  });
</script>
```

### Requirements

- Minimum iframe width: 320px
- The embed route (`/embed`) allows framing from `derbydigital.us` and `*.derbydigital.us`
- All other routes block framing via `X-Frame-Options: DENY`

## Development

```bash
npm install
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | — | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | Supabase anon key |
| `SUPABASE_SERVICE_KEY` | — | Supabase service role key |
| `ADMIN_PASSWORD` | `derby2026` | Admin dashboard password |
