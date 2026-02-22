import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import OpenAI from 'openai';

// APIキーが設定されていない場合は終了します。
if (!process.env.OPENAI_API_KEY) {
    console.error("エラー: .envファイルに OPENAI_API_KEY が設定されていません。");
    process.exit(1);
}

// 注意: コストパフォーマンスと最新のAPI仕様に基づき、gpt-5-mini を使用します。
// （gpt-4.1-miniに比べても安価で、今回の用途には十分な性能があります）
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const jsonPath = path.join(process.cwd(), 'src/data/kanji.json');

// スクリプト実行時に引数で対象とする学年（1〜6）を指定できます
// 例: node scripts/generateWithLLM.js 1
const targetGrade = parseInt(process.argv[2], 10);

if (isNaN(targetGrade) || targetGrade < 1 || targetGrade > 6) {
    console.error("エラー: 第1引数に処理する学年（1〜6）を指定してください。");
    console.log("使用例: node scripts/generateWithLLM.js 1");
    process.exit(1);
}

const generateKanjiDetails = async () => {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // 対象学年のうち、詳細データ（コツ・由来等）がまだ空の漢字のみ抽出します
    const targetKanjis = data.filter(k => k.grade === targetGrade && !k.origin);

    if (targetKanjis.length === 0) {
        console.log(`第${targetGrade}学年の漢字データはすべて生成済みです。`);
        return;
    }

    console.log(`第${targetGrade}学年: ${targetKanjis.length}文字の詳細データを生成します。`);

    // APIコールの制限やエラーを避けるため、1文字ずつ直列で処理します（時間がかかるためログを出力します）
    let updatedCount = 0;
    for (let i = 0; i < targetKanjis.length; i++) {
        const item = targetKanjis[i];
        console.log(`[${i + 1}/${targetKanjis.length}] 「${item.kanji}」のデータを生成中...`);

        const prompt = `
あなたはとても優しくて褒め上手な小学校の先生です。
${targetGrade}年生で習う漢字「${item.kanji}」について、小学生が読んで興味を持てるように教えてください。
文章は「小学校3年生までに習う漢字」を使って作成してください（ひらがなが多すぎると逆に読みにくいため、適度に漢字を混ぜてください）。
難しい表現は避け、小学生にわかりやすい平易な言葉遣いにしてください。

以下の5つの情報を含めて、必ず **指定したJSON形式でのみ** 出力してください（マークダウンや余計な文章は含めないでください）。

1. 読み方 (readings): 音読み(on)と訓読み(kun)の配列。何も無い場合は空配列 [] を指定。カタカナとひらがなを正確に区別すること。
2. 上手に書くコツ (tips): 20文字程度。例「一番下の横線はすこし長めにひこう！」
3. 成り立ちの由来 (origin): 例「木と木がならんで『林』になったんだよ。」
4. いつ使う？ (examples): よく使う言葉や熟語を3つ、ふりがなつきで。例: ["学校（がっこう）", "学生（がくせい）"]
5. 似ている漢字 (similar): 形が似ていて間違えやすい漢字を1〜2つの配列で。無い場合は空配列 []。

===出力してほしいJSONの形式===
{
  "readings": {
    "on": ["スイ"],
    "kun": ["みず"]
  },
  "tips": "ここはあなたが考えたコツ",
  "origin": "ここはあなたが考えた由来",
  "examples": ["水（みず）", "水曜日（すいようび）"],
  "similar": ["氷", "木"]
}
`;

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-5-mini", // 最新かつ低コストな gpt-5-mini を使用
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            });

            const responseJson = JSON.parse(completion.choices[0].message.content);

            // 元のデータに上書きマージ
            const index = data.findIndex(k => k.kanji === item.kanji);
            if (index !== -1) {
                data[index] = { ...data[index], ...responseJson };
                updatedCount++;
                // 途中経過を保存しつつ進める（APIエラー時などのため）
                fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
            }

            // レートリミット回避のための1秒待機
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.error(`「${item.kanji}」の生成中にエラーが発生しました:`, error.message);
            // エラー時はスキップして次へ
        }
    }

    console.log(`処理完了: ${updatedCount}文字のデータを更新しました。`);
};

generateKanjiDetails();
