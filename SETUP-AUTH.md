# 🔐 Setup de Autenticación con Supabase

Este ZIP contiene todos los archivos necesarios para añadir login/signup a tu proyecto Replyo.

---

## 📋 Pasos de instalación

### 1. Instalar dependencias

Abre terminal en tu carpeta del proyecto:

```bash
cd C:\Users\yoelc\Desktop\replyo-fixed
npm install @supabase/supabase-js @supabase/ssr
```

### 2. Copiar archivos a tu proyecto

Copia el contenido de este ZIP a tu carpeta `replyo-fixed`. La estructura final debe ser:

```
replyo-fixed/
├── lib/
│   ├── supabase-client.ts          ← NUEVO
│   ├── supabase-server.ts          ← NUEVO
│   ├── i18n.tsx                    (ya existe)
│   └── utils.ts                    (ya existe)
├── components/
│   ├── auth/
│   │   ├── AuthLayout.tsx          ← NUEVO
│   │   └── LogoutButton.tsx        ← NUEVO
│   └── landing/                    (ya existe)
├── app/
│   ├── login/
│   │   └── page.tsx                ← NUEVO
│   ├── signup/
│   │   └── page.tsx                ← NUEVO
│   ├── forgot-password/
│   │   └── page.tsx                ← NUEVO
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts            ← NUEVO
│   ├── dashboard/
│   │   └── page.tsx                ← NUEVO (placeholder)
│   ├── globals.css                 (ya existe)
│   ├── layout.tsx                  (ya existe)
│   └── page.tsx                    (ya existe)
├── middleware.ts                   ← NUEVO (en raíz, NO dentro de app/)
└── .env.local                      (ya creaste, con las claves)
```

### 3. Verificar `.env.local`

Tu archivo debe contener (con TUS claves regeneradas):

```
NEXT_PUBLIC_SUPABASE_URL=https://avumcgrgngotinmibwxw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_aqui
```

### 4. Configurar Supabase Auth

En el dashboard de Supabase:

1. Ve a **Authentication → Sign In / Providers**
2. Asegúrate de que **Email** está habilitado
3. (Opcional) Desactiva "Confirm email" durante desarrollo para ir más rápido:
   - Authentication → Sign In / Providers → Email
   - Desactiva "Confirm email"
   - Para producción lo activas de nuevo

4. Ve a **Authentication → URL Configuration**
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** añade `http://localhost:3000/auth/callback`

### 5. Probar

```bash
npm run dev
```

- Ve a http://localhost:3000/signup → crea una cuenta
- Si confirmaste email → revisa Supabase → Authentication → Users (debería aparecer)
- Ve a http://localhost:3000/login → entra
- Te redirige a `/dashboard`
- Si intentas ir a `/dashboard` sin login → te redirige a `/login`

---

## 🐛 Si algo falla

**Error: "Cannot find module @supabase/ssr"**
→ No instalaste las dependencias. Ejecuta `npm install` de nuevo.

**Error: "Invalid login credentials"**
→ Email/contraseña incorrectos, O no confirmaste el email.

**No me redirige al dashboard**
→ Revisa que `middleware.ts` está en la RAÍZ del proyecto (mismo nivel que `package.json`), NO dentro de `app/`.

**El email de confirmación no llega**
→ Revisa spam. O desactiva "Confirm email" en Supabase (paso 4) para desarrollo.
