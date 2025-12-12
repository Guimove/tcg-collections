import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AkiraPage from './pages/AkiraPage';
import YugiohPage from './pages/YugiohPage';
import RiftboundPage from './pages/RiftboundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/akira" element={<AkiraPage />} />
        <Route path="/yugioh" element={<YugiohPage />} />
        <Route path="/riftbound" element={<RiftboundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
