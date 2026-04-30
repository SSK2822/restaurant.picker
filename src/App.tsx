import { Link, Route, Routes } from "react-router-dom";
import Home from "./routes/Home";
import Spin from "./routes/Spin";
import Place from "./routes/Place";

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="px-5 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-3xl group-hover:rotate-12 transition-transform">🐦</span>
          <span className="font-display text-2xl font-bold text-sun-900">
            Sunny Bird
          </span>
        </Link>
        <span className="hidden sm:block text-sm text-sun-700/70">
          pick a place, no overthinking
        </span>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-5 pb-12">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/spin/:slug" element={<Spin />} />
          <Route path="/place/:slug/:placeId" element={<Place />} />
        </Routes>
      </main>
      <footer className="px-5 py-6 text-center text-xs text-sun-700/60">
        synced daily from Google Maps · notes live in your browser
      </footer>
    </div>
  );
}
