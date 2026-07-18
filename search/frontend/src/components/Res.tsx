import type { ResJson } from "../types";
import { getImageUrl } from "../utils/Fetch";
import { NoLink } from "./NoLink";

export function ResMeta({
  res,
  onIdClick,
}: {
  res: ResJson;
  onIdClick: (id: string) => void;
}) {
  return (
    <div className="mb-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-label-tertiary">
      <NoLink no={res.no} />
      <span className="text-sm font-semibold text-label">
        {res.name_and_trip}
      </span>
      <span className="text-label-secondary">{res.datetime_text}</span>
      <button
        type="button"
        onClick={() => onIdClick(res.id)}
        title="このIDの投稿を検索"
        className="pressable inline-flex cursor-pointer items-center gap-1 rounded-full bg-fill px-2 py-0.5 font-mono text-[11px] text-label-secondary hover:bg-accent-soft hover:text-accent"
      >
        <svg
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
          />
        </svg>
        ID: {res.id}
      </button>
    </div>
  );
}

export function ResBody({ res }: { res: ResJson }) {
  return (
    <div
      className="prose prose-sm max-w-none leading-relaxed text-label prose-a:text-accent prose-a:no-underline hover:prose-a:underline dark:prose-invert"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: backend provides pre-rendered post HTML.
      dangerouslySetInnerHTML={{ __html: res.main_text_html }}
    />
  );
}

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
        highlighted ? "-mx-3 rounded-2xl bg-highlight px-3" : ""
      }`}
    >
      <ResMeta res={res} onIdClick={onIdClick} />
      <ResBody res={res} />
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
    <div className="prose prose-sm mt-3 dark:prose-invert">
      <img
        src={imageUrl}
        alt={res.oekaki_title}
        className="max-w-full rounded-2xl"
        style={{ boxShadow: "0 0 0 0.5px var(--separator)" }}
      />
      {res.oekaki_title && (
        <div className="text-label">タイトル: {res.oekaki_title}</div>
      )}
      {res.original_oekaki_res_no && (
        <div className="text-label">
          <NoLink no={res.original_oekaki_res_no} /> この絵を基にしています！
        </div>
      )}
    </div>
  );
}
