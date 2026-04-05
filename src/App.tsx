import { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { collectibles } from './collectibles';

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><div className="loading-spinner" /></div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {collectibles.map((c) => (
            <Route key={c.slug} path={`/${c.slug}`} element={<c.page />} />
          ))}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
