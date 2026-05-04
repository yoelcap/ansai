# Replyo

Gestión inteligente de reseñas para restaurantes y bares con IA.

## Stack

- **Next.js 15** + React 19 + TypeScript
- **Tailwind CSS** para estilos
- **Multi-idioma** nativo (ES, EN, NL, FR, IT)

## Cómo arrancar el proyecto en local

### 1. Instala Node.js
Necesitas Node.js 20 o superior. Descárgalo de [nodejs.org](https://nodejs.org).

### 2. Instala dependencias
Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
```

Esto descarga todas las librerías. Tarda 1-2 minutos la primera vez.

### 3. Levanta el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador. La landing debería cargar.

Cualquier cambio que hagas en el código se ve en directo (hot reload).

### 4. Build para producción

```bash
npm run build
npm start
```

## Estructura del proyecto

```
app/
├── page.tsx              # Landing page (componente raíz)
├── layout.tsx            # Layout con fuentes y metadata
└── globals.css           # Estilos globales y paleta

components/
└── landing/              # Componentes de la landing
    ├── Navbar.tsx
    ├── Hero.tsx
    ├── Problem.tsx
    ├── HowItWorks.tsx
    ├── Features.tsx
    ├── Pricing.tsx
    ├── FAQ.tsx
    ├── FinalCTA.tsx
    └── Footer.tsx

lib/
├── i18n.tsx              # Sistema de traducciones
└── utils.ts              # Utilidades

locales/
├── es.json               # Traducciones español
├── en.json               # Traducciones inglés
├── nl.json               # Traducciones neerlandés
├── fr.json               # Traducciones francés
└── it.json               # Traducciones italiano
```

## Deploy a Vercel (gratis)

1. Sube el código a un repositorio de GitHub
2. Ve a [vercel.com](https://vercel.com) y crea cuenta con GitHub
3. Importa el repo
4. Vercel detecta Next.js automáticamente y hace el deploy
5. Te dan una URL gratis tipo `replyo.vercel.app`
6. Cuando tengas dominio (`replyo.app`), lo apuntas en Vercel

## TODO

- [ ] Conectar formulario de email a backend real (Resend o Formspree)
- [ ] Añadir páginas legales (Términos, Privacidad)
- [ ] Implementar páginas de login y signup
- [ ] Construir la app privada (dashboard, reseñas, settings)
- [ ] Conectar con backend C#/.NET
- [ ] Integrar Google Business Profile API
- [ ] Integrar Anthropic API (Claude Opus 4.7)
- [ ] Integrar Stripe para pagos
