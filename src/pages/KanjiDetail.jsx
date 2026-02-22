import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, FastForward } from 'lucide-react';
import kanjiData from '../data/kanji.json';
import './KanjiDetail.css';

export const KanjiDetail = () => {
    const { kanji } = useParams();
    const navigate = useNavigate();
    const svgRef = useRef(null);
    const kanjiInfo = kanjiData.find(k => k.kanji === kanji);

    const [svgContent, setSvgContent] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    useEffect(() => {
        if (!kanji) return;

        const charCode = kanji.charCodeAt(0);
        const hex = charCode.toString(16).toLowerCase().padStart(5, '0');

        fetch(`/kanji/${hex}.svg`)
            .then(res => res.ok ? res.text() : Promise.reject('Not Found'))
            .then(content => {
                // SVGタグの開始から終了までを抽出し、不要なXML宣言やDOCTYPEを削除
                const svgMatch = content.match(/<svg[\s\S]*<\/svg>/);
                const cleanSvg = svgMatch ? svgMatch[0] : content;

                let processed = cleanSvg
                    .replace(/<svg/, '<svg class="kanjivg-svg"')
                    .replace(/<path/g, '<path class="stroke-path kanji-path-hidden"');
                setSvgContent(processed);
            })
            .catch(err => {
                console.error("Failed to load SVG for kanji", kanji, err);
                setSvgContent('<div class="error-msg">かんじのデータがみつかりません。</div>');
            });
    }, [kanji]);

    useEffect(() => {
        if (!svgContent || !svgRef.current || !isPlaying) return;

        const paths = Array.from(svgRef.current.querySelectorAll('path.stroke-path'));
        if (paths.length === 0) return;

        let timeoutIds = [];
        let currentDelay = 0;
        const baseDuration = 800;
        const duration = baseDuration / playbackSpeed;
        const pauseBetweenStrokes = 300 / playbackSpeed;

        paths.forEach(p => {
            p.classList.remove('kanji-path-hidden');
            const length = p.getTotalLength();
            p.style.strokeDasharray = length + ' ' + length;
            p.style.strokeDashoffset = length;
        });

        paths.forEach((path, index) => {
            const tid = setTimeout(() => {
                path.style.transition = `stroke-dashoffset ${duration}ms ease-in-out`;
                path.style.strokeDashoffset = '0';

                if (index === paths.length - 1) {
                    const finalTid = setTimeout(() => setIsPlaying(false), duration + 200);
                    timeoutIds.push(finalTid);
                }
            }, currentDelay);

            timeoutIds.push(tid);
            currentDelay += duration + pauseBetweenStrokes;
        });

        return () => {
            timeoutIds.forEach(clearTimeout);
        };
    }, [isPlaying, svgContent, playbackSpeed]);

    const handlePlay = () => {
        if (isPlaying) return;
        setIsPlaying(true);
    };

    const handlePause = () => {
        setIsPlaying(false);
        if (svgRef.current) {
            const paths = svgRef.current.querySelectorAll('path.stroke-path');
            paths.forEach(p => {
                const computedStyle = window.getComputedStyle(p);
                const currentOffset = computedStyle.getPropertyValue('stroke-dashoffset');
                p.style.transition = 'none';
                p.style.strokeDashoffset = currentOffset;
            });
        }
    };

    const handleReset = () => {
        setIsPlaying(false);
        if (svgRef.current) {
            const paths = svgRef.current.querySelectorAll('path.stroke-path');
            paths.forEach(p => {
                p.style.transition = 'none';
                p.className = 'stroke-path kanji-path-hidden';
                p.style.strokeDasharray = '';
                p.style.strokeDashoffset = '';
            });
        }
    };

    const toggleSpeed = () => {
        setPlaybackSpeed(prev => prev === 1 ? 2 : prev === 2 ? 0.5 : 1);
    };

    if (!kanjiInfo) {
        return (
            <div className="page-container">
                <p>かんじが みつかりません: {kanji}</p>
                <button onClick={() => navigate(-1)} className="back-button"><ArrowLeft size={20} /> もどる</button>
            </div>
        );
    }

    return (
        <div className="kanji-detail-page page-container">
            <header className="page-header">
                <button onClick={() => navigate(-1)} className="back-button">
                    <ArrowLeft size={24} /> もどる
                </button>
                <h2>{kanjiInfo.grade}ねんせい</h2>
            </header>

            <div className="detail-layout">
                <div className="visual-section">
                    <div className="kanji-display-area">
                        <div
                            className="kanji-svg-container"
                            ref={svgRef}
                            dangerouslySetInnerHTML={{ __html: svgContent }}
                        />
                        <div className="grid-lines">
                            <div className="grid-h"></div>
                            <div className="grid-v"></div>
                        </div>
                    </div>

                    <div className="controls">
                        <button onClick={isPlaying ? handlePause : handlePlay} className={`control-btn ${isPlaying ? 'pause' : 'play'}`}>
                            {isPlaying ? <Pause size={28} /> : <Play size={28} fill="currentColor" />}
                        </button>
                        <button onClick={handleReset} className="control-btn reset">
                            <RotateCcw size={24} />
                        </button>
                        <button onClick={toggleSpeed} className="control-btn speed" title="再生速度">
                            <FastForward size={24} />
                            <span className="speed-label">x{playbackSpeed}</span>
                        </button>
                    </div>
                </div>

                <div className="info-section">
                    <div className="readings-box">
                        <div className="reading-group">
                            <h3>音読み（おんよみ）</h3>
                            <p>{kanjiInfo.readings.on.length > 0 ? kanjiInfo.readings.on.join('、 ') : 'なし'}</p>
                        </div>
                        <div className="reading-group">
                            <h3>訓読み（くんよみ）</h3>
                            <p>{kanjiInfo.readings.kun.length > 0 ? kanjiInfo.readings.kun.join('、 ') : 'なし'}</p>
                        </div>
                    </div>

                    <div className="extended-info">
                        <div className="info-block">
                            <h4>💡 上手に書くコツ</h4>
                            <p>{kanjiInfo.tips || '（データじゅんび中）'}</p>
                        </div>
                        <div className="info-block">
                            <h4>📖 成り立ち（由来）</h4>
                            <p>{kanjiInfo.origin || '（データじゅんび中）'}</p>
                        </div>
                        <div className="info-block">
                            <h4>📚 よく使う言葉（使用例）</h4>
                            <ul className="examples-list">
                                {kanjiInfo.examples.length > 0
                                    ? kanjiInfo.examples.map((ex, i) => <li key={i}>{ex}</li>)
                                    : <li>（データじゅんび中）</li>
                                }
                            </ul>
                        </div>
                        <div className="info-block">
                            <h4>⚠️ 似ている漢字</h4>
                            <div className="similar-kanji">
                                {kanjiInfo.similar.length > 0
                                    ? kanjiInfo.similar.map((sim, i) => <Link to={`/kanji/${sim}`} key={i} className="similar-chip">{sim}</Link>)
                                    : <span>（データじゅんび中）</span>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
