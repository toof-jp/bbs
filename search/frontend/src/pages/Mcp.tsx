import { Header } from "../components/Header";

const MCP_ENDPOINT = "https://bbs-mcp.toof.jp/mcp";

const TOOLS = [
  {
    name: "search_posts",
    description:
      "本文・投稿者ID・名前/トリップ・期間などの条件でレスを検索する (カーソルページング対応)",
  },
  {
    name: "count_posts",
    description: "検索条件に一致するレス総数とユニーク投稿者ID数を返す",
  },
  {
    name: "get_ranking",
    description: "投稿者IDランキングを返す (投稿数順 / 直近活動順)",
  },
  {
    name: "get_oekaki_image",
    description: "oekaki_idを指定してお絵かき画像を取得する",
  },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-fill p-4 font-mono text-[13px] leading-relaxed text-label">
      <code>{children}</code>
    </pre>
  );
}

export default function Mcp() {
  return (
    <>
      <Header />
      <div className="min-h-screen px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="page-title">MCPサーバー</h1>

          <div className="card mb-6 p-6">
            <p className="leading-relaxed text-label-secondary">
              この掲示板検索は{" "}
              <a
                href="https://modelcontextprotocol.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link"
              >
                MCP (Model Context Protocol)
              </a>{" "}
              サーバーとしても公開されています。Claude
              などのAIアシスタントに接続すると、AIが掲示板のレス検索・集計・お絵かき画像の取得を行えるようになります。
            </p>
          </div>

          <div className="card mb-6 p-6">
            <h2 className="mb-3 text-lg font-semibold tracking-[-0.01em] text-label">
              エンドポイント
            </h2>
            <CodeBlock>{MCP_ENDPOINT}</CodeBlock>
            <p className="mt-3 text-sm text-label-secondary">
              Streamable HTTP形式・認証なしで利用できます。
            </p>
          </div>

          <div className="card mb-6 p-6">
            <h2 className="mb-3 text-lg font-semibold tracking-[-0.01em] text-label">
              利用できるツール
            </h2>
            <ul className="space-y-3">
              {TOOLS.map((tool) => (
                <li key={tool.name}>
                  <code className="rounded-md bg-fill px-2 py-0.5 font-mono text-[13px] text-label">
                    {tool.name}
                  </code>
                  <p className="mt-1 text-sm text-label-secondary">
                    {tool.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="card mb-6 p-6">
            <h2 className="mb-3 text-lg font-semibold tracking-[-0.01em] text-label">
              接続方法
            </h2>

            <h3 className="mb-2 font-semibold text-label">Claude Code</h3>
            <CodeBlock>
              {`claude mcp add --transport http bbs-search ${MCP_ENDPOINT}`}
            </CodeBlock>

            <h3 className="mb-2 mt-4 font-semibold text-label">
              claude.ai (カスタムコネクタ)
            </h3>
            <p className="text-sm text-label-secondary">
              「設定」→「コネクタ」→「カスタムコネクタを追加」でURLに上記エンドポイントを入力してください。
            </p>

            <h3 className="mb-2 mt-4 font-semibold text-label">
              その他のMCPクライアント
            </h3>
            <CodeBlock>
              {`{
  "mcpServers": {
    "bbs-search": {
      "type": "http",
      "url": "${MCP_ENDPOINT}"
    }
  }
}`}
            </CodeBlock>
          </div>

          <div className="card p-6">
            <h2 className="mb-3 text-lg font-semibold tracking-[-0.01em] text-label">
              使用例
            </h2>
            <ul className="list-inside list-disc space-y-1 text-sm text-label-secondary">
              <li>「昨日いちばん投稿数が多かったIDを調べて」</li>
              <li>「『ラーメン』を含むレスを検索して要約して」</li>
              <li>「最近投稿されたお絵かきを見せて」</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
