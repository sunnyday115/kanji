import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const KYOIKU_KANJI_TEXT = `
1年: 一右雨円王音下火花貝学気九休玉金空月犬見五口校左三山子四糸字耳七車手十出女小上森人水正生青夕石赤千川先早草足村大男竹中虫町天田土二日入年白八百文木本名目立力林六 (80)
2年: 引羽雲園遠何科夏家歌画回会海絵外角楽活間丸岩顔汽記帰弓牛魚京強教近兄形計元言原戸古午後語工公広交光考行高黄合谷国黒今才細作算止市矢姉思紙寺自時室社弱首秋週春書少場色食心新親図数西声星晴切雪船線前組走多太体台地池知茶昼長鳥朝直通弟店点電刀冬当東答頭同道読内南肉馬売買麦半番父風分聞米歩母方北毎妹万明鳴毛門夜野友用曜来里理話 (160)
3年: 悪安暗医委意育員院飲運泳駅央横屋温化荷界開階寒感漢館岸起期客究急級宮球去橋業曲局銀区苦具君係軽血決研県庫湖向幸港号根祭皿仕死使始指歯詩次事持式実写者主守取酒受州拾終習集住重宿所暑助昭消商章勝乗植申身神真深進世整昔全相送想息速族他打対待代第題炭短談着注柱丁帳調追定庭笛鉄転都度投豆島湯登等動童農波配倍箱畑発反坂板皮悲美鼻筆氷表秒病品負部服福物平返勉放味命面問役薬由油有遊予羊洋葉陽様落流旅両緑礼列練路和 (200)
4年: 愛案以衣位囲胃印英栄塩億加果貨課芽改械害街各覚完官管関観願希季紀喜旗器機議求泣救給挙漁共協鏡競極訓軍郡径型景芸欠結建健験固功好候航康告差菜最材昨札刷殺察参産散残士氏史司試児治辞失借種周祝順初松笑唱焼象照賞臣信成省清静席積折節説浅戦選然争倉巣束側続卒孫帯隊達単置仲貯兆腸低底停的典伝徒努灯堂働特得毒熱念敗梅博飯飛費必票標不夫付府副粉兵別辺変便包法望牧末満未脈民無約勇要養浴利陸良料量輪類令冷例歴連老労録 (202)
5年: 圧移因永営衛易益液演応往桜恩可仮価河過賀快解格確額刊幹慣眼基寄規技義逆久旧居許境均禁句群経潔件券険検限現減故個護効厚耕鉱構興講混査再災妻採際在財罪雑酸賛支志枝師資飼示似識質舎謝授修述術準序招条状常情織職制性政勢精製税責績接設舌絶銭祖素総造像増則測属率損退貸態団断築張提程適敵統銅導徳独任燃能破犯判版比肥非備俵評貧布婦富武復複仏編弁保墓報豊防貿暴務夢迷綿輸余預容略留領 (193)
6年: 異遺域宇羽映延沿我灰拡革閣割株干巻看簡危机揮貴疑吸供胸郷勤筋系敬警劇激穴絹権憲源厳己呼誤后孝皇紅降鋼刻穀骨困砂座済裁策冊蚕至私姿視詞誌磁射捨尺若樹収宗就衆従縦縮熟純処署諸除将傷障城蒸針仁垂推寸盛聖誠宣専泉洗染善奏窓創装層操蔵臓存尊宅担探誕段暖値宙宙忠著庁頂潮賃痛展討党糖届難乳認納脳派拝背肺俳班晩否批秘腹奮並陛閉片補暮宝訪亡忘棒枚幕密盟模訳郵優幼欲翌乱卵覧裏律臨朗論 (191)
`;

const extractKanji = () => {
    const list = {};
    const lines = KYOIKU_KANJI_TEXT.trim().split('\n');
    let total = 0;
    for (const line of lines) {
        const match = line.match(/^(\d)年: (.*) \(\d+\)$/);
        if (match) {
            const grade = parseInt(match[1]);
            const chars = match[2].trim().replace(/\s/g, '').split('');
            const uniqueChars = [...new Set(chars)];
            total += uniqueChars.length;
            list[grade] = uniqueChars;
        }
    }
    console.log("Total education kanji extracted: " + total);
    return list;
};

const main = async () => {
    const grades = extractKanji();

    // Write out the proper JSON
    const kanjiData = [];
    Object.keys(grades).forEach(grade => {
        grades[grade].forEach(char => {
            kanjiData.push({
                kanji: char,
                grade: parseInt(grade, 10),
                readings: { on: [], kun: [] },
                tips: "",
                origin: "",
                examples: [],
                similar: []
            });
        });
    });

    const dir = path.join(process.cwd(), 'src/data');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'kanji.json'), JSON.stringify(kanjiData, null, 2));
    console.log('Successfully wrote src/data/kanji.json');

    // Prepare KanjiVG
    console.log('Cloning kanjivg repository...');
    if (!fs.existsSync('kanjivg-repo')) {
        execSync('npx -y degit KanjiVG/kanjivg kanjivg-repo', { stdio: 'inherit' });
    }

    const svgDir = path.join(process.cwd(), 'public/kanji');
    if (!fs.existsSync(svgDir)) {
        fs.mkdirSync(svgDir, { recursive: true });
    }

    // Copy SVGs
    console.log('Copying relevant SVG files...');
    let copied = 0;
    let missing = 0;
    kanjiData.forEach(entry => {
        const charCode = entry.kanji.charCodeAt(0);
        let hex = charCode.toString(16).toLowerCase();
        hex = hex.padStart(5, '0');
        const filename = hex + '.svg';

        const srcFile = path.join(process.cwd(), 'kanjivg-repo/kanji', filename);
        const destFile = path.join(svgDir, filename);

        if (fs.existsSync(srcFile)) {
            fs.copyFileSync(srcFile, destFile);
            copied++;
        } else {
            console.warn("Missing SVG for " + entry.kanji + " (" + hex + ")");
            missing++;
        }
    });

    console.log("Copied " + copied + " SVG files. Missing: " + missing);
};

main();
