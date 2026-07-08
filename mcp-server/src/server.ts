import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, Count, RankingResponse, Res } from "./client.js";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");

const filterSchema = {
  main_text: z.string().optional().describe("本文の部分一致検索文字列"),
  id: z.string().optional().describe("投稿者IDの前方一致検索文字列"),
  name_and_trip: z
    .string()
    .optional()
    .describe("名前・トリップの部分一致検索文字列"),
  since: dateSchema.optional().describe("この日付以降 (YYYY-MM-DD)"),
  until: dateSchema.optional().describe("この日付以前 (YYYY-MM-DD)"),
  oekaki: z
    .boolean()
    .optional()
    .describe("trueならお絵かき付きの投稿のみを対象にする"),
};

function toText(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

export function buildServer(): McpServer {
  const server = new McpServer({
    name: "bbs-search",
    version: "0.1.0",
  });

  server.registerTool(
    "search_posts",
    {
      title: "掲示板検索",
      description:
        "掲示板 (https://bbs.toof.jp) のレスを検索する。条件はAND結合。" +
        "結果はレス番号順で、next_cursorを次回のcursorに渡すと続きを取得できる。",
      inputSchema: {
        ...filterSchema,
        ascending: z
          .boolean()
          .optional()
          .describe("trueで古い順、省略時は新しい順"),
        cursor: z
          .number()
          .int()
          .optional()
          .describe("ページング用カーソル (前回のnext_cursor)"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("取得件数 (1-100、デフォルト20)"),
      },
    },
    async ({ limit, ...params }) => {
      const rows = await apiGet<Res[]>("/search", params);
      const sliced = rows.slice(0, limit ?? 20);
      const posts = sliced.map((row) => ({
        no: row.no,
        name_and_trip: row.name_and_trip,
        datetime: row.datetime,
        id: row.id,
        main_text: row.main_text,
        oekaki_id: row.oekaki_id ?? undefined,
        oekaki_title: row.oekaki_title ?? undefined,
      }));
      return toText({
        posts,
        next_cursor:
          sliced.length > 0 ? sliced[sliced.length - 1].no : undefined,
        has_more: rows.length > sliced.length || rows.length === 100,
      });
    },
  );

  server.registerTool(
    "count_posts",
    {
      title: "掲示板レス数カウント",
      description:
        "検索条件に一致する掲示板のレス総数とユニーク投稿者ID数を返す。",
      inputSchema: filterSchema,
    },
    async (params) => toText(await apiGet<Count>("/search/count", params)),
  );

  server.registerTool(
    "get_ranking",
    {
      title: "投稿者IDランキング",
      description:
        "掲示板の投稿者IDランキングを返す。post_count=投稿数順、recent_activity=直近の投稿日時順。",
      inputSchema: {
        ...filterSchema,
        ranking_type: z
          .enum(["post_count", "recent_activity"])
          .optional()
          .describe("ランキング種別 (デフォルト post_count)"),
        min_posts: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("最低投稿数 (デフォルト1)"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("取得件数 (1-100、デフォルト20)"),
      },
    },
    async ({ limit, ...params }) => {
      const data = await apiGet<RankingResponse>("/ranking", params);
      return toText({
        ranking: data.ranking.slice(0, limit ?? 20),
        total_unique_ids: data.total_unique_ids,
        total_res_count: data.total_res_count,
      });
    },
  );

  return server;
}
