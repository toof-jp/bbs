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
    <pre className="overflow-x-auto rounded bg-gray-100 p-4 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100">
      <code>{children}</code>
    </pre>
  );
}

export default function Mcp() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 py-8 px-4 dark:bg-gray-950">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center dark:text-gray-100">
            MCPサーバー
          </h1>

          <div className="bg-white shadow-md rounded-lg p-6 mb-6 dark:bg-gray-900">
            <p className="text-gray-700 leading-relaxed dark:text-gray-300">
              この掲示板検索は{" "}
              <a
                href="https://modelcontextprotocol.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                MCP (Model Context Protocol)
              </a>{" "}
              サーバーとしても公開されています。Claude
              などのAIアシスタントに接続すると、AIが掲示板のレス検索・集計・お絵かき画像の取得を行えるようになります。
            </p>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 mb-6 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-800 mb-3 dark:text-gray-100">
              エンドポイント
            </h2>
            <CodeBlock>{MCP_ENDPOINT}</CodeBlock>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Streamable HTTP形式・認証なしで利用できます。
            </p>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 mb-6 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-800 mb-3 dark:text-gray-100">
              利用できるツール
            </h2>
            <ul className="space-y-3">
              {TOOLS.map((tool) => (
                <li key={tool.name}>
                  <code className="rounded bg-gray-100 px-2 py-0.5 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                    {tool.name}
                  </code>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {tool.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 mb-6 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-800 mb-3 dark:text-gray-100">
              接続方法
            </h2>

            <h3 className="font-semibold text-gray-800 mb-2 dark:text-gray-200">
              Claude Code
            </h3>
            <CodeBlock>
              {`claude mcp add --transport http bbs-search ${MCP_ENDPOINT}`}
            </CodeBlock>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2 dark:text-gray-200">
              claude.ai (カスタムコネクタ)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              「設定」→「コネクタ」→「カスタムコネクタを追加」でURLに上記エンドポイントを入力してください。
            </p>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2 dark:text-gray-200">
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

          <div className="bg-white shadow-md rounded-lg p-6 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-800 mb-3 dark:text-gray-100">
              使用例
            </h2>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
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
