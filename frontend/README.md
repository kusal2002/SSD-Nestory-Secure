# Nestory Frontend

A responsive React application built with **Vite**, **TypeScript**, and **Tailwind CSS** for managing family reading activities. This frontend provides separate interfaces for parents/guardians, children, and administrators.

## 🚀 Features

### Parent/Guardian Interface
- Family management and child profile creation
- Reading assignment tracking
- Story library browsing and discovery
- Family reading analytics and progress tracking
- Dashboard with quick stats and recent activity

### Child Interface
- Age-appropriate story recommendations
- Reading session logging
- Personal reading statistics and achievements
- Visual progress tracking with playful animations
- Reading streak counter

### Admin Panel
- User management and role assignment
- Story library management
- System statistics and monitoring
- Google Books integration for story imports

## 🛠️ Tech Stack

- **Framework**: React 18.2.0 with TypeScript
- **Build Tool**: Vite 5.0.0
- **Styling**: Tailwind CSS 3.3.6
- **Routing**: React Router 6.20.0
- **HTTP Client**: Axios 1.6.0
- **Icons**: Lucide React 0.292.0
- **Notifications**: React Hot Toast 2.4.1

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── common/         # Shared components (nav, sidebar, etc.)
│   │   ├── parent/         # Parent interface components
│   │   ├── child/          # Child interface components
│   │   └── admin/          # Admin panel components
│   ├── pages/              # Page-level components (routes)
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── parent/
│   │   ├── child/
│   │   └── admin/
│   ├── services/           # API client services
│   │   ├── apiClient.ts    # Base Axios instance
│   │   ├── authService.ts
│   │   ├── familyService.ts
│   │   ├── childService.ts
│   │   ├── storyService.ts
│   │   ├── readingService.ts
│   │   ├── assignmentService.ts
│   │   └── dashboardService.ts
│   ├── contexts/           # React Context for state management
│   │   └── AuthContext.tsx
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript interfaces
│   ├── utils/              # Helper functions
│   ├── styles/             # Global styles and animations
│   │   └── index.css
│   ├── App.tsx             # Main app component with routing
│   └── main.tsx            # React entry point
├── public/                 # Static assets
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── postcss.config.cjs      # PostCSS configuration
├── package.json
└── .env.local              # Environment variables (local only)
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```
   Update `VITE_API_URL` to match your backend API endpoint (default: `http://localhost:5000/api`)

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   Navigate to `http://localhost:5173`

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## 🎨 Custom Animations

The project includes contextual animations defined in `tailwind.config.ts`:

### Playful Animations (Children's Interface)
- `animate-bounce-gentle` - Gentle bouncing motion
- `animate-wiggle` - Wiggling side-to-side
- `animate-hop` - Hopping animation
- `animate-pulse-glow` - Pulsing glow effect
- `animate-float` - Floating motion
- `animate-sparkle` - Sparkling effect

### Professional Animations (Parent/Admin Interface)
- `animate-slide-up` - Slide up entrance
- `animate-slide-down` - Slide down entrance
- `animate-fade-in` - Fade in effect
- `animate-fade-out` - Fade out effect
- `animate-scale-in` - Scale and fade in
- `animate-slide-in-left` - Slide from left
- `animate-slide-in-right` - Slide from right

## 🔐 Authentication

- Uses JWT token-based authentication with the backend
- Tokens stored in localStorage with automatic injection in requests
- Protected routes redirect unauthenticated users to login
- Role-based routing (parent, child, admin)
- Automatic logout on token expiration

## 🧩 API Integration

All API calls go through the service layer in `src/services/`:

```typescript
// Example: Getting family dashboard
import dashboardService from '@/services/dashboardService';

const dashboard = await dashboardService.getFamilyDashboard();
```

Services automatically:
- Inject JWT token from localStorage
- Handle errors and show user-friendly messages
- Redirect to login on 401 responses
- Format request/response data

## 📱 Responsive Design

Built with mobile-first approach using Tailwind's breakpoints:
- **Mobile**: 375px and up
- **Tablet**: 768px and up (md breakpoint)
- **Desktop**: 1024px and up (lg breakpoint)
- **Large Desktop**: 1280px and up (xl breakpoint)

All components tested and optimized for touch devices with minimum 48px button sizes.

## 🎯 Demo Credentials

For testing with the demo backend:
- **Email**: parent@example.com or child@example.com
- **Password**: password123

## 🌐 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:5000/api` | Backend API endpoint |

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel deploy
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## 📚 Available Components (MVP)

### Shared Components
- Navigation Bar
- Sidebar
- Cards
- Buttons (primary, secondary, outline, danger, success)
- Form Inputs
- Loading Spinners
- Badges
- Toast Notifications

### Page Components
- LoginPage
- RegisterPage
- ParentDashboard
- ChildDashboard
- AdminDashboard

## 🔄 State Management

- **Authentication**: React Context (`AuthContext`)
- **Component State**: React Hooks (useState, useEffect)
- **Global Storage**: localStorage for token and user data

Future enhancements can add Redux/Zustand if needed for more complex state.

## 🐛 Troubleshooting

### Port 5173 Already in Use
```bash
npm run dev -- --port 3000
```

### API Connection Issues
- Ensure backend is running on `http://localhost:5000`
- Verify `VITE_API_URL` in `.env.local` is correct
- Check browser console for CORS errors

### Build Errors
```bash
npm install --legacy-peer-deps
npm run build
```

## 📖 Next Steps

1. **Expand Parent Interface**
   - Full family management pages
   - Reading assignment creation and tracking
   - Story library with filters
   - Analytics dashboard

2. **Expand Child Interface**
   - Story discovery with age-filtering
   - Reading session workflow
   - Achievement and gamification UI
   - Personal statistics pages

3. **Complete Admin Panel**
   - Full user management
   - Story CRUD operations
   - System monitoring

4. **Add Missing Features**
   - Form validation components
   - Image upload handling
   - PDF story viewer (optional)
   - Real-time notifications (WebSocket)

## 📄 License

This project is part of the Nestory family reading platform.

## 🤝 Contributing

Please follow the existing code structure and naming conventions when adding features.
