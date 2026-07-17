import type { ResJson } from "../types";
import { getImageUrl } from "../utils/Fetch";
import { NoLink } from "./NoLink";

export function Res({
  res,
  onIdClick,
  highlighted = false,
}: {
  res: ResJson;
  onIdClick: (id: string) => void;
  highlighted?: boolean;
}) {
  return (
    <li
      className={`py-4 ${
        highlighted
          ? "-mx-2 rounded-lg bg-yellow-50 px-2 dark:bg-yellow-900/20"
          : ""
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
        <NoLink no={res.no} />
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {res.name_and_trip}
        </span>
        <span>{res.datetime_text}</span>
        <button
          type="button"
          onClick={() => onIdClick(res.id)}
          className="cursor-pointer rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600 transition hover:bg-indigo-50 hover:text-indigo-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
        >
          ID: {res.id}
        </button>
      </div>
      <div
        className="prose prose-sm max-w-none text-gray-800 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline dark:prose-invert dark:text-gray-100 dark:prose-a:text-indigo-400"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: backend provides pre-rendered post HTML.
        dangerouslySetInnerHTML={{ __html: res.main_text_html }}
      />
      {res.oekaki_id && <Oekaki res={res} />}
    </li>
  );
}

function Oekaki({ res }: { res: ResJson }) {
  if (!res.oekaki_id) {
    return null;
  }

  const imageUrl = getImageUrl(res.oekaki_id);
  return (
    <div className="prose prose-sm mt-2 dark:prose-invert">
      <img
        src={imageUrl}
        alt={res.oekaki_title}
        className="max-w-full rounded-lg border border-gray-200 dark:border-gray-800"
      />
      {res.oekaki_title && (
        <div className="text-gray-800 dark:text-gray-100">
          タイトル: {res.oekaki_title}
        </div>
      )}
      {res.original_oekaki_res_no && (
        <div className="text-gray-800 dark:text-gray-100">
          <NoLink no={res.original_oekaki_res_no} /> この絵を基にしています！
        </div>
      )}
    </div>
  );
}
