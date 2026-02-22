import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import kanjiData from '../data/kanji.json';
import './GradeList.css';

export const GradeList = () => {
    const { gradeId } = useParams();
    const navigate = useNavigate();
    const grade = parseInt(gradeId, 10);

    if (isNaN(grade) || grade < 1 || grade > 6) {
        return (
            <div className="page-container">
                <p>がくねんが みつかりません。</p>
                <Link to="/" className="back-link"><ArrowLeft size={20} /> ホームへもどる</Link>
            </div>
        );
    }

    // 指定学年の漢字をフィルタリングして五十音順にする（今回はSJIS/Unicode順で簡易ソート）
    const gradeKanji = kanjiData
        .filter(k => k.grade === grade)
        .sort((a, b) => a.kanji.localeCompare(b.kanji, 'ja'));

    return (
        <div className="grade-page page-container">
            <header className="page-header">
                <button onClick={() => navigate('/')} className="back-button">
                    <ArrowLeft size={24} />
                    もどる
                </button>
                <h2>{grade}ねんせい の かんじ ({gradeKanji.length}字)</h2>
            </header>

            <div className="kanji-grid">
                {gradeKanji.map(({ kanji }) => (
                    <Link
                        to={`/kanji/${kanji}`}
                        key={kanji}
                        className="kanji-card"
                        style={{ borderColor: `var(--grade-${grade}-color)` }}
                    >
                        <span className="kanji-char">{kanji}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
};
