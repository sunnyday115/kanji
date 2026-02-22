import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import './Home.css';

const GRADES = [
    { id: 1, label: '1年生', color: 'var(--grade-1-color)' },
    { id: 2, label: '2年生', color: 'var(--grade-2-color)' },
    { id: 3, label: '3年生', color: 'var(--grade-3-color)' },
    { id: 4, label: '4年生', color: 'var(--grade-4-color)' },
    { id: 5, label: '5年生', color: 'var(--grade-5-color)' },
    { id: 6, label: '6年生', color: 'var(--grade-6-color)' },
];

export const Home = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/kanji/${searchQuery.trim()[0]}`); // 最初の1文字で検索
        }
    };

    return (
        <div className="home-container page-container">
            <section className="search-section">
                <h2>かんじを さがす</h2>
                <form onSubmit={handleSearch} className="search-box">
                    <input
                        type="text"
                        placeholder="漢字を1文字入力..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        maxLength={1}
                        autoFocus
                    />
                    <button type="submit" aria-label="検索" disabled={!searchQuery.trim()}>
                        <Search size={24} />
                    </button>
                </form>
            </section>

            <section className="grade-section">
                <h2>がくねんから えらぶ</h2>
                <div className="grade-grid">
                    {GRADES.map(grade => (
                        <button
                            key={grade.id}
                            onClick={() => navigate(`/grade/${grade.id}`)}
                            className="grade-card"
                            style={{ backgroundColor: grade.color }}
                        >
                            {grade.label}
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
};
