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
        highlighted ? "-mx-2 rounded bg-yellow-50 px-2 dark:bg-yellow-900/20" : ""
      }`}
    >
      <div className="text-sm text-gray-600 mb-2 dark:text-gray-400">
        <NoLink no={res.no} /> <div className="inline">{res.name_and_trip}</div>{" "}
        <div className="inline">{res.datetime_text}</div>{" "}
        <div className="inline">
          ID:{" "}
          <button
            type="button"
            onClick={() => onIdClick(res.id)}
            className="hover:underline text-blue-600 cursor-pointer dark:text-blue-400"
          >
            {res.id}
          </button>
        </div>
      </div>
      <div
        className="text-gray-800 prose prose-sm max-w-none prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline dark:prose-invert dark:text-gray-100 dark:prose-a:text-blue-400"
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
    <div className="mt-2 prose prose-sm dark:prose-invert">
      <img src={imageUrl} alt={res.oekaki_title} className="max-w-full" />
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
