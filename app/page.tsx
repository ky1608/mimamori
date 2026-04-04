export default function Home() {
  return (
    <div className="min-h-screen bg-[#FFFDF9] text-gray-800 font-sans">

      {/* ナビゲーション */}
      <nav className="fixed top-0 w-full bg-[#FFFDF9]/90 backdrop-blur-sm border-b border-orange-100 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <span className="text-xl font-bold text-orange-500">mimamori</span>
          <a
            href="/register"
            className="bg-orange-400 hover:bg-orange-500 text-white text-sm font-medium px-5 py-2 rounded-full transition-colors"
          >
            申し込む
          </a>
        </div>
      </nav>

      {/* 1. ファーストビュー */}
      <section className="pt-36 pb-28 px-6 text-center bg-gradient-to-b from-orange-50 via-[#FFF8F0] to-[#FFFDF9]">
        <div className="max-w-2xl mx-auto">
          <p className="text-orange-400 font-medium text-sm tracking-widest mb-6">AI見守り電話サービス</p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-800 mb-8">
            両親の声を、<br />
            <span className="text-orange-400">毎日確認</span>できていますか？
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed mb-12">
            離れて暮らす親のことが気になりながら、<br className="hidden md:block" />
            なかなか電話できない日が続いていませんか。<br />
            <span className="font-medium text-gray-600">mimamori</span> は、あなたの代わりに毎日声をかけます。
          </p>
          <a
            href="/register"
            className="inline-block bg-orange-400 hover:bg-orange-500 text-white font-bold text-lg px-12 py-5 rounded-full shadow-md hover:shadow-lg transition-all"
          >
            申し込む →
          </a>
          <p className="text-sm text-gray-400 mt-5">月額¥3,980（税込）・いつでも解約可能</p>
        </div>
      </section>

      {/* 2. 課題提起 */}
      <section className="py-24 px-6 bg-[#FFFDF9]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
            こんな気持ち、ありませんか？
          </h2>
          <p className="text-center text-gray-400 mb-16 text-sm">多くのご家族が抱えている、リアルな声です。</p>

          <div className="space-y-6">
            {[
              {
                emoji: "📱",
                scene: "電話しようと思ったけど、もう夜9時。寝てるかもしれないし、また明日にしよう——そんな「また明日」が続いている。",
              },
              {
                emoji: "🤐",
                scene: "「元気よ、心配しないで」って言うけど、本当のことを話してくれているのか分からない。親は気を使いすぎる。",
              },
              {
                emoji: "😔",
                scene: "仕事・育児・家事で毎日いっぱいいっぱい。親のことが気になりながらも、後回しにしてしまっている自分が嫌になる。",
              },
              {
                emoji: "🚑",
                scene: "何かあってから気づいても遅い。「なんで気づいてあげられなかったんだろう」と後悔したくない。",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-5 bg-orange-50 rounded-2xl p-6 border border-orange-100">
                <div className="text-3xl flex-shrink-0">{item.emoji}</div>
                <p className="text-gray-600 leading-relaxed">{item.scene}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. サービス説明 */}
      <section className="py-24 px-6 bg-amber-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
            毎朝、AIがあなたの代わりに電話します。
          </h2>
          <p className="text-center text-gray-500 mb-16 leading-relaxed">
            難しい設定は不要。親の電話番号を登録するだけで、<br className="hidden md:block" />
            翌朝から見守りがスタートします。
          </p>

          <div className="space-y-8">
            {[
              {
                step: "1",
                time: "毎朝8時ごろ",
                title: "AIが親に電話をかける",
                desc: "「おはようございます。今日の体調はいかがですか？」——自然な会話で、眠れたか、食欲はあるか、体の痛みはないかを穏やかに確認します。親はただ話すだけでOK。スマートフォンも操作も不要です。",
              },
              {
                step: "2",
                time: "通話直後",
                title: "会話の内容をLINEでお届け",
                desc: "「今日は少し足が痛いとおっしゃっていました」「昨夜よく眠れなかったようです」——AIが会話を要約し、ポイントだけをLINEに送ります。忙しい日でも、ひと目で親の様子が分かります。",
              },
              {
                step: "3",
                time: "いつでも",
                title: "過去の記録をいつでも確認",
                desc: "1週間前と比べて体調が変わっていないか、同じ訴えが続いていないか——履歴を見れば、小さな変化にも気づけます。",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 bg-white rounded-2xl p-8 shadow-sm border border-orange-100">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {item.step}
                </div>
                <div>
                  <p className="text-orange-400 text-xs font-medium mb-1">{item.time}</p>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. 3ステップ */}
      <section className="py-24 px-6 bg-[#FFFDF9]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">3ステップで始められます</h2>
          <p className="text-center text-gray-400 mb-16 text-sm">登録から見守りスタートまで、最短10分。</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "アカウント登録",
                desc: "メールアドレスとパスワードだけで登録完了。難しい設定は一切ありません。",
              },
              {
                step: "02",
                title: "親の情報を入力",
                desc: "名前・電話番号・電話してほしい時間帯を入力します。既往症などのメモも書き添えられます。",
              },
              {
                step: "03",
                title: "翌朝から自動でスタート",
                desc: "あとは何もしなくて大丈夫。翌朝から自動的に電話がかかり、結果がLINEで届きます。",
              },
            ].map((item) => (
              <div key={item.step} className="text-center bg-amber-50 rounded-2xl p-8 border border-orange-100">
                <div className="text-orange-300 font-bold text-4xl mb-4">{item.step}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. 料金 */}
      <section className="py-24 px-6 bg-[#FFFDF9]">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">シンプルな料金</h2>
          <p className="text-gray-400 mb-12 text-sm">プランは1つだけ。毎日の安心を、毎日のコーヒー1杯分で。</p>
          <div className="bg-white rounded-3xl shadow-md p-10 border border-orange-100">
            <div className="text-orange-400 font-bold text-sm mb-3 tracking-widest">スタンダードプラン</div>
            <div className="text-5xl font-bold text-gray-800 mb-1">
              ¥3,980
              <span className="text-xl font-normal text-gray-400"> / 月</span>
            </div>
            <p className="text-gray-400 text-sm mb-8">税込 ¥4,378</p>
            <ul className="text-left space-y-4 mb-10 text-gray-600 text-sm">
              {[
                "毎日1回のAI電話（時間帯指定可）",
                "通話後すぐにLINEレポート",
                "電話に出なかった場合の不在通知",
                "過去の会話履歴を閲覧",
                "気になる変化のアラート通知",
                "いつでも解約可能・違約金なし",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="text-orange-400 font-bold mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="/register"
              className="block w-full bg-orange-400 hover:bg-orange-500 text-white font-bold py-4 rounded-full transition-colors"
            >
              申し込む
            </a>
          </div>
        </div>
      </section>

      {/* 5. よくある質問 */}
      <section className="py-24 px-6 bg-amber-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-16">よくある質問</h2>
          <div className="space-y-5">
            {[
              {
                q: "親がスマートフォンを持っていなくても使えますか？",
                a: "はい。AIからの電話は普通の固定電話・携帯電話にかかります。親側にスマートフォンやアプリは一切不要です。",
              },
              {
                q: "AIとの会話はどんな内容ですか？不自然ではないですか？",
                a: "「今日の体調はいかがですか？」「よく眠れましたか？」など自然な会話です。多くの方が「普通の電話みたい」とおっしゃっています。",
              },
              {
                q: "親に「AIに電話させている」と知られますか？",
                a: "最初の電話時に「ご家族の依頼でお電話しています」とご案内します。AIであることは正直にお伝えするスタンスです。",
              },
              {
                q: "電話に出なかった場合はどうなりますか？",
                a: "不在だった場合、すぐにLINEでお知らせします。連続で出ない場合には緊急アラートを送る設定もできます。",
              },
              {
                q: "解約はいつでもできますか？",
                a: "はい、いつでも解約可能です。解約後は当月末まで利用できます。違約金・手数料は一切かかりません。",
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-orange-100">
                <h3 className="font-bold text-gray-800 mb-3 text-sm md:text-base">Q. {item.q}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">A. {item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-orange-400 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-orange-100 text-sm mb-3">今日から始められます</p>
          <h2 className="text-3xl font-bold mb-5">
            「あのとき連絡していれば」<br />と思う日が来る前に。
          </h2>
          <p className="text-orange-100 mb-10 leading-relaxed">
            毎日の小さな確認が、家族の大きな安心になります。
          </p>
          <a
            href="/register"
            className="inline-block bg-white text-orange-500 font-bold text-lg px-12 py-5 rounded-full shadow-lg hover:shadow-xl transition-all hover:bg-orange-50"
          >
            申し込む →
          </a>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-800 text-gray-400 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <span className="text-white font-bold text-lg">mimamori</span>
          <div className="flex gap-6">
            <a href="/terms" className="hover:text-white transition-colors">利用規約</a>
            <a href="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</a>
            <a href="/contact" className="hover:text-white transition-colors">お問い合わせ</a>
          </div>
          <span>© 2026 mimamori. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
}
