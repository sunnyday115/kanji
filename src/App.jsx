import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home as HomeIcon } from 'lucide-react';
import { Home } from './pages/Home';
import { GradeList } from './pages/GradeList';
import { KanjiDetail } from './pages/KanjiDetail';
import './App.css';

function App() {
  return (
    <Router>
      <header className="app-header">
        <Link to="/" className="logo">
          <HomeIcon size={28} />
          <h1>かんじのれんしゅう</h1>
        </Link>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/grade/:gradeId" element={<GradeList />} />
          <Route path="/kanji/:kanji" element={<KanjiDetail />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
