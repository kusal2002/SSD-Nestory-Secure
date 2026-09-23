# Nestory Frontend - Quick Start Guide

## 🚀 Start Development Server (5 minutes)

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Ensure Backend is Running
Start the backend server (default: http://localhost:5000)
```bash
cd backend
npm start
```

### Step 3: Start Frontend Dev Server
In a new terminal window:
```bash
cd frontend
npm run dev
```

Open browser to **http://localhost:5173**

---

## 📝 Login with Demo Accounts

### Parent/Guardian Account
- **Email**: parent@example.com
- **Password**: password123

### Child Account  
- **Email**: child@example.com
- **Password**: password123

### Admin Account
- **Email**: admin@example.com
- **Password**: password123

---

## 🛠️ Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

---

## 📱 Testing on Different Screen Sizes

### Chrome DevTools
1. Press `F12` or `Ctrl+Shift+I`
2. Click the device toggle icon (mobile phone icon)
3. Select device:
   - **Mobile**: iPhone 12 (390×844)
   - **Tablet**: iPad Air (820×1180)
   - **Desktop**: Full width (>1024px)

All pages are responsive and tested on all breakpoints.

---

## 🎯 What's Implemented

### ✅ Authentication
- Login page with email/password validation
- Register page with role selection (Parent/Admin)
- JWT token management with automatic injection in API calls
- Protected routes that redirect to login

### ✅ Dashboard Pages
- **Parent Dashboard**: Family overview, stats cards, recent activity
- **Child Dashboard**: Playful interface with books, achievements, reading stats
- **Admin Dashboard**: User management, story management, system stats

### ✅ API Integration
All services configured and ready to consume backend:
- Auth Service (login, register, profile)
- Family Service (CRUD operations)
- Child Service (CRUD operations)
- Story Service (search, filtering, import)
- Reading Service (session tracking)
- Assignment Service (create, update status)
- Dashboard Service (analytics)

### ✅ UI/UX
- Tailwind CSS styling with custom animations
- Playful animations for child interface (bounce, wiggle, float, etc.)
- Professional animations for parent/admin interface (slide, fade, scale)
- Form validation with error messages
- Toast notifications for feedback
- Loading states and skeleton screens
- Responsive design (mobile, tablet, desktop)

---

## 📂 File Organization

```
frontend/src/
├── components/          (Coming: reusable UI components)
├── contexts/           (Auth state management)
├── pages/              (Page components)
│   ├── admin/         (Admin dashboard)
│   ├── child/         (Child dashboard)
│   ├── parent/        (Parent dashboard)
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
├── services/           (API integration services)
├── types/              (TypeScript interfaces)
├── App.tsx             (Main routing)
├── main.tsx            (Entry point)
└── index.css           (Global styles + Tailwind)
```

---

## 🔐 How Authentication Works

1. **User logs in** → Email & password sent to backend
2. **Backend returns JWT token** + user data
3. **Token stored in localStorage** + set in Auth Context
4. **Token auto-injected** in all API request headers
5. **Protected routes** check Auth Context before rendering
6. **401 response** → token cleared, redirected to login

---

## 🚨 Common Issues & Solutions

### Port 5173 Already in Use
```bash
npm run dev -- --port 3000
```

### Backend Connection Error
Verify backend is running:
```bash
# Backend terminal
cd backend
npm start  # Should start on port 5000
```

Check `.env.local` has correct API URL:
```
VITE_API_URL=http://localhost:5000/api
```

### Hot Reload Not Working
Kill the dev server and restart:
```bash
npm run dev
```

### Build Errors
Clear cache and reinstall:
```bash
npm install --legacy-peer-deps
npm run build
```

---

## 📚 Next Development Steps

### Phase 4-5: Expand Feature Pages
1. Build full parent dashboard with:
   - Family management forms
   - Child profile creation and editing
   - Reading assignment creation
   - Story library with search and filters
   - Family analytics and charts

2. Build full child interface with:
   - Story discovery and browsing
   - Reading session workflow
   - Personal statistics page
   - Achievement showcase

3. Complete admin panel with:
   - Full user management CRUD
   - Story library management
   - Google Books import integration

### Create Reusable Components
- `<InputField />` - Form input wrapper
- `<Select />` - Dropdown selector
- `<Modal />` - Modal dialog
- `<StoryCard />` - Story preview card
- `<StatCard />` - Stat display card
- `<Navbar />` - Navigation bar
- `<Sidebar />` - Sidebar navigation

### Add Missing Pages
- `/family/:id` - Family details
- `/child/:id` - Child profile
- `/stories` - Story library
- `/assignments/:childId` - Child's assignments
- `/settings` - User settings

---

## 🎨 Customizing Animations

Edit `tailwind.config.ts` to adjust animations:

```typescript
// Playful animations for children
'bounce-gentle': 'bounce-gentle 1.5s ease-in-out infinite',
'wiggle': 'wiggle 0.6s ease-in-out infinite',
'float': 'float 3s ease-in-out infinite',

// Professional animations for parents/admins  
'slide-up': 'slide-up 0.4s ease-out',
'fade-in': 'fade-in 0.4s ease-out',
```

---

## 📊 Monitor Build Size

Check production bundle size:
```bash
npm run build
# Look for dist/ folder size
```

Current: ~239KB JS (77KB gzipped) + 22KB CSS

---

## 🤝 Contributing

When adding new features:

1. **Create feature branch**: `git checkout -b feature/my-feature`
2. **Follow file structure**: Components in `/components`, pages in `/pages`
3. **Use TypeScript**: All files should have proper types
4. **Follow naming**: React components PascalCase, files match component name
5. **Test responsive**: Verify on mobile (375px) and desktop (1024px+)
6. **Commit with message**: `feat: add story library UI` or `fix: auth token expiry`

---

## 📚 Useful Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Router v6](https://reactrouter.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

## ✅ Checklist for Running Locally

- [ ] Node.js 16+ installed
- [ ] Backend started on :5000
- [ ] Frontend dependencies installed (`npm install`)
- [ ] `.env.local` configured with API URL
- [ ] Dev server running (`npm run dev`)
- [ ] Can access http://localhost:5173
- [ ] Can login with demo credentials
- [ ] Dashboard appears for your role
- [ ] No console errors
- [ ] Animations playing smoothly

---

## 🚀 Ready to Develop!

You're all set! Start by implementing the features for Phase 4-5.

Questions? Check the `/frontend/README.md` for more details.
