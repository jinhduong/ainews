# AI News Frontend

A modern, responsive React application for browsing AI and technology news, powered by your AI News backend API.

## Features

- 🎯 **Focused Categories**: Tech and AI news only
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- ⚡ **Fast Loading**: Optimized with caching and modern React patterns
- 🔄 **Smart Pagination**: Easy navigation through news articles
- 🎨 **Modern UI**: Clean, card-based design with hover effects
- ♿ **Accessible**: Full keyboard navigation and screen reader support
- 🔄 **Auto-retry**: Automatic retry on failed requests

## Tech Stack

- **React 18** - Modern React with concurrent features
- **TypeScript** - Type safety and better developer experience
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **TanStack Query** - Powerful data fetching and caching
- **Lucide React** - Beautiful, consistent icons

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   # Create .env file
   echo "VITE_API_KEY=your-api-key-here" > .env
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**: http://localhost:5173

## Configuration

### Environment Variables

- `VITE_API_KEY` - API key for the backend news service

### Backend Integration

The frontend expects the backend to be running on `http://localhost:3000` with the following endpoint:

- `POST /api/v1/news` - Fetch news articles

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # React components
│   ├── CategoryTabs.tsx # Category switcher (Tech/AI)
│   ├── NewsCard.tsx     # Individual article card
│   ├── NewsGrid.tsx     # Main news display grid
│   ├── Pagination.tsx   # Page navigation
│   ├── LoadingSpinner.tsx
│   └── ErrorMessage.tsx
├── services/
│   └── newsApi.ts       # API integration
├── types/
│   └── news.ts          # TypeScript interfaces
├── App.tsx              # Main app component
├── main.tsx             # App entry point
└── index.css            # Global styles
```

## Design Principles

- **Clean & Simple**: Minimal, distraction-free interface
- **Fast & Efficient**: Optimized loading and caching
- **Accessible**: WCAG compliant with full keyboard support
- **Responsive**: Mobile-first design approach
- **Modern**: Latest React patterns and best practices 