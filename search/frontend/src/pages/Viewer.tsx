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
  const topObserver = useRef<IntersectionObserver | null>(null);

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
    const down: ResJson[] = await fetchData("search", viewerForm(true), no - 1);
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

  // センチネルはジャンプ完了後に初めて DOM に現れるため、
  // useEffect ではなく callback ref で Observer を設置する
  const topSentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      topObserver.current?.disconnect();
      topObserver.current = null;
      if (!node) {
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
      observer.observe(node);
      topObserver.current = observer;
    },
    [loadUp],
  );

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
    <div className="flex justify-center py-4">
      <div className="spinner h-8 w-8" />
    </div>
  );

  const inputClassName = "input";
  const buttonClassName = "btn-primary";

  return (
    <>
      <Header />
      <div className="min-h-screen px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="page-title">掲示板ビュワー</h1>
          <div
            className="material-chrome sticky top-[60px] z-30 mb-4 rounded-2xl p-4"
            style={{ boxShadow: "0 0 0 0.5px var(--separator)" }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <form
                onSubmit={handleNoSubmit}
                className="flex items-center gap-2"
              >
                <label
                  htmlFor="jump-no"
                  className="shrink-0 whitespace-nowrap text-[13px] font-medium text-label-secondary"
                >
                  レス番号
                </label>
                <input
                  id="jump-no"
                  type="number"
                  min="1"
                  value={noInput}
                  onChange={(event) => setNoInput(event.target.value)}
                  className={`${inputClassName} min-w-0 flex-1 sm:w-32 sm:flex-none`}
                  placeholder="1"
                />
                <button
                  type="submit"
                  disabled={isJumping}
                  className={`${buttonClassName} shrink-0`}
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
                  className="shrink-0 whitespace-nowrap text-[13px] font-medium text-label-secondary"
                >
                  日時
                </label>
                <input
                  id="jump-datetime"
                  type="datetime-local"
                  value={datetimeInput}
                  onChange={(event) => setDatetimeInput(event.target.value)}
                  className={`${inputClassName} min-w-0 flex-1 sm:w-auto sm:flex-none`}
                />
                <button
                  type="submit"
                  disabled={isJumping}
                  className={`${buttonClassName} shrink-0`}
                >
                  ジャンプ
                </button>
              </form>
              <button
                type="button"
                onClick={handleLatestClick}
                disabled={isJumping}
                className="btn-secondary self-start sm:self-auto"
              >
                最新へ
              </button>
            </div>
          </div>
          {notice && (
            <div className="banner-notice mb-4">{notice}</div>
          )}
          {isJumping
            ? spinner
            : result.length > 0 && (
                <div className="card p-6" style={{ overflowAnchor: "none" }}>
                  <div ref={topSentinelRef} />
                  {hasMoreUp ? (
                    spinner
                  ) : (
                    <div className="pb-2 text-center text-sm text-label-tertiary">
                      これより前のレスはありません
                    </div>
                  )}
                  <InfiniteScroll
                    loadMore={loadDown}
                    hasMore={hasMoreDown}
                    loader={spinner}
                  >
                    <ul className="divide-y divide-separator">
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
                        className="btn-secondary"
                      >
                        新着を確認
                      </button>
                    </div>
                  )}
                </div>
              )}
        </div>
      </div>
    </>
  );
}
