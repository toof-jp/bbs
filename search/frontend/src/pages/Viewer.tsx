import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import InfiniteScroll from "react-infinite-scroller";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Header } from "../components/Header";
import { Res } from "../components/Res";
import type { FormData, ResJson } from "../types";
import { fetchData } from "../utils/Fetch";

const RESULT_LIMIT = 100;
const MAX_CURSOR = 2147483647;

function viewerForm(ascending: boolean, since = ""): FormData {
  return {
    id: "",
    main_text: "",
    name_and_trip: "",
    ascending,
    since,
    until: "",
  };
}

// NaiveDateTime は "YYYY-MM-DDTHH:MM:SS" で届くので、
// datetime-local の値 "YYYY-MM-DDTHH:MM" と文字列比較できる
function resDatetime(res: ResJson): string {
  return String(res.datetime);
}

export default function Viewer() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<ResJson[]>([]);
  const [hasMoreDown, setHasMoreDown] = useState(false);
  const [hasMoreUp, setHasMoreUp] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [anchorNo, setAnchorNo] = useState<number | null>(null);
  const [noInput, setNoInput] = useState(searchParams.get("no") || "");
  const [datetimeInput, setDatetimeInput] = useState(
    searchParams.get("datetime") || "",
  );

  const topCursor = useRef(0);
  const bottomCursor = useRef(0);
  const hasMoreUpRef = useRef(false);
  const loadingUp = useRef(false);
  const loadingDown = useRef(false);
  const pendingScrollHeight = useRef<number | null>(null);
  const pendingScrollBottom = useRef(false);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  const setHasMoreUpBoth = (value: boolean) => {
    hasMoreUpRef.current = value;
    setHasMoreUp(value);
  };

  const loadUp = useCallback(async () => {
    if (loadingUp.current || !hasMoreUpRef.current) {
      return;
    }
    loadingUp.current = true;
    try {
      const response: ResJson[] = await fetchData(
        "search",
        viewerForm(false),
        topCursor.current,
      );
      if (response.length === 0) {
        hasMoreUpRef.current = false;
        setHasMoreUp(false);
        return;
      }
      topCursor.current = response[response.length - 1].no;
      if (response.length < RESULT_LIMIT) {
        hasMoreUpRef.current = false;
        setHasMoreUp(false);
      }
      // プリペンドで表示位置がずれないよう、描画後に scrollTop を補正する
      pendingScrollHeight.current =
        document.scrollingElement?.scrollHeight ?? null;
      setResult((prev) => [...response.slice().reverse(), ...prev]);
    } finally {
      loadingUp.current = false;
    }
  }, []);

  const loadDown = async () => {
    if (loadingDown.current) {
      return;
    }
    loadingDown.current = true;
    try {
      const response: ResJson[] = await fetchData(
        "search",
        viewerForm(true),
        bottomCursor.current,
      );
      if (response.length < RESULT_LIMIT) {
        setHasMoreDown(false);
      }
      if (response.length === 0) {
        return;
      }
      bottomCursor.current = response[response.length - 1].no;
      setResult((prev) => [...prev, ...response]);
    } finally {
      loadingDown.current = false;
    }
  };

  const showLatest = async () => {
    const response: ResJson[] = await fetchData(
      "search",
      viewerForm(false),
      MAX_CURSOR,
    );
    const posts = response.slice().reverse();
    setAnchorNo(null);
    if (posts.length === 0) {
      setResult([]);
      setHasMoreDown(false);
      setHasMoreUpBoth(false);
      return;
    }
    topCursor.current = posts[0].no;
    bottomCursor.current = posts[posts.length - 1].no;
    setResult(posts);
    setHasMoreDown(false);
    setHasMoreUpBoth(response.length === RESULT_LIMIT);
    pendingScrollBottom.current = true;
  };

  const jumpToNoCore = async (no: number) => {
    const down: ResJson[] = await fetchData(
      "search",
      viewerForm(true),
      no - 1,
    );
    if (down.length === 0) {
      setNotice("指定のレス番号以降の投稿がないため、最新のレスを表示します。");
      await showLatest();
      return;
    }
    topCursor.current = down[0].no;
    bottomCursor.current = down[down.length - 1].no;
    setResult(down);
    setHasMoreDown(down.length === RESULT_LIMIT);
    setHasMoreUpBoth(down[0].no > 1);
    setAnchorNo(down[0].no);
    window.scrollTo(0, 0);
  };

  // レス番号は時系列順なので、日付で絞った後にレス番号の二分探索で
  // 指定日時以降の最初のレスを見つける
  const findNoByDatetime = async (
    datetime: string,
  ): Promise<number | "latest"> => {
    const since = datetime.slice(0, 10);
    const first: ResJson[] = await fetchData(
      "search",
      viewerForm(true, since),
      0,
    );
    if (first.length === 0) {
      return "latest";
    }
    const hit = first.find((res) => resDatetime(res) >= datetime);
    if (hit) {
      return hit.no;
    }
    if (first.length < RESULT_LIMIT) {
      return "latest";
    }
    const latestPage: ResJson[] = await fetchData(
      "search",
      viewerForm(false),
      MAX_CURSOR,
    );
    if (latestPage.length === 0 || resDatetime(latestPage[0]) < datetime) {
      return "latest";
    }
    let lo = first[first.length - 1].no + 1;
    let hi = latestPage[0].no;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      const page: ResJson[] = await fetchData(
        "search",
        viewerForm(true),
        mid - 1,
      );
      if (page.length === 0 || resDatetime(page[0]) >= datetime) {
        hi = mid;
        continue;
      }
      const found = page.find((res) => resDatetime(res) >= datetime);
      if (found) {
        return found.no;
      }
      lo = page[page.length - 1].no + 1;
    }
    return hi;
  };

  const jumpToNo = async (no: number) => {
    setIsJumping(true);
    setNotice(null);
    try {
      await jumpToNoCore(no);
    } finally {
      setIsJumping(false);
    }
  };

  const jumpToDatetime = async (datetime: string) => {
    setIsJumping(true);
    setNotice(null);
    try {
      const no = await findNoByDatetime(datetime);
      if (no === "latest") {
        setNotice("指定日時以降の投稿がないため、最新のレスを表示します。");
        await showLatest();
      } else {
        await jumpToNoCore(no);
      }
    } finally {
      setIsJumping(false);
    }
  };

  const jumpToLatest = async () => {
    setIsJumping(true);
    setNotice(null);
    try {
      await showLatest();
    } finally {
      setIsJumping(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: URL query params are loaded once on page entry.
  useEffect(() => {
    const noParam = searchParams.get("no");
    const datetimeParam = searchParams.get("datetime");
    if (noParam && /^\d+$/.test(noParam)) {
      jumpToNo(Number.parseInt(noParam, 10));
    } else if (datetimeParam) {
      jumpToDatetime(datetimeParam);
    } else {
      jumpToLatest();
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll compensation must run after each result change.
  useLayoutEffect(() => {
    const el = document.scrollingElement;
    if (!el) {
      return;
    }
    if (pendingScrollHeight.current !== null) {
      el.scrollTop += el.scrollHeight - pendingScrollHeight.current;
      pendingScrollHeight.current = null;
    } else if (pendingScrollBottom.current) {
      el.scrollTop = el.scrollHeight;
      pendingScrollBottom.current = false;
    }
  }, [result]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadUp();
        }
      },
      { rootMargin: "300px 0px 0px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadUp]);

  const handleNoSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const no = Number.parseInt(noInput, 10);
    if (!Number.isFinite(no) || no < 1) {
      return;
    }
    setDatetimeInput("");
    setSearchParams({ no: no.toString() });
    jumpToNo(no);
  };

  const handleDatetimeSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!datetimeInput) {
      return;
    }
    setNoInput("");
    setSearchParams({ datetime: datetimeInput });
    jumpToDatetime(datetimeInput);
  };

  const handleLatestClick = () => {
    setNoInput("");
    setDatetimeInput("");
    setSearchParams({});
    jumpToLatest();
  };

  const handleIdClick = (id: string) => {
    navigate(`/?id=${encodeURIComponent(id)}`);
  };

  const spinner = (
    <div className="flex justify-center py-4 text-gray-600">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400" />
    </div>
  );

  const inputClassName =
    "rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";
  const buttonClassName =
    "rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50";

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 py-8 px-4 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center dark:text-gray-100">
            掲示板ビュワー
          </h1>
          <div className="bg-white shadow-md rounded-lg p-4 mb-4 dark:bg-gray-900">
            <div className="flex flex-wrap items-center gap-4">
              <form onSubmit={handleNoSubmit} className="flex items-center gap-2">
                <label
                  htmlFor="jump-no"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  レス番号
                </label>
                <input
                  id="jump-no"
                  type="number"
                  min="1"
                  value={noInput}
                  onChange={(event) => setNoInput(event.target.value)}
                  className={`${inputClassName} w-32`}
                  placeholder="1"
                />
                <button
                  type="submit"
                  disabled={isJumping}
                  className={buttonClassName}
                >
                  ジャンプ
                </button>
              </form>
              <form
                onSubmit={handleDatetimeSubmit}
                className="flex items-center gap-2"
              >
                <label
                  htmlFor="jump-datetime"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  日時
                </label>
                <input
                  id="jump-datetime"
                  type="datetime-local"
                  value={datetimeInput}
                  onChange={(event) => setDatetimeInput(event.target.value)}
                  className={inputClassName}
                />
                <button
                  type="submit"
                  disabled={isJumping}
                  className={buttonClassName}
                >
                  ジャンプ
                </button>
              </form>
              <button
                type="button"
                onClick={handleLatestClick}
                disabled={isJumping}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                最新へ
              </button>
            </div>
          </div>
          {notice && (
            <div className="mb-4 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
              {notice}
            </div>
          )}
          {isJumping ? (
            spinner
          ) : (
            result.length > 0 && (
              <div
                className="bg-white shadow-md rounded-lg p-6 dark:bg-gray-900"
                style={{ overflowAnchor: "none" }}
              >
                <div ref={topSentinelRef} />
                {hasMoreUp ? (
                  spinner
                ) : (
                  <div className="pb-2 text-center text-sm text-gray-500 dark:text-gray-400">
                    これより前のレスはありません
                  </div>
                )}
                <InfiniteScroll
                  loadMore={loadDown}
                  hasMore={hasMoreDown}
                  loader={spinner}
                >
                  <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                    {result.map((res) => (
                      <Res
                        key={res.no}
                        res={res}
                        onIdClick={handleIdClick}
                        highlighted={res.no === anchorNo}
                      />
                    ))}
                  </ul>
                </InfiniteScroll>
                {!hasMoreDown && (
                  <div className="pt-4 text-center">
                    <button
                      type="button"
                      onClick={() => loadDown()}
                      className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      新着を確認
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}
