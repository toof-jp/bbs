import { useState, useRef, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroller";
import { useSearchParams } from "react-router-dom";

import type { ResJson, CountJson, FormData } from "../types";
import { fetchData, getImageUrl } from "../utils/Fetch";
import { Form } from "../components/Form";
import { Count } from "../components/Count";
import { NoLink } from "../components/NoLink";
import { Header } from "../components/Header";
import { ResBody, ResMeta } from "../components/Res";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [formData, setFormData] = useState<FormData>(() => ({
    id: searchParams.get("id") || "",
    main_text: searchParams.get("main_text") || "",
    name_and_trip: searchParams.get("name_and_trip") || "",
    ascending: searchParams.get("ascending") === "true",
    since: searchParams.get("since") || "",
    until: searchParams.get("until") || "",
  }));
  const [result, setResult] = useState<Array<ResJson>>([]);
  const [count, setCount] = useState<CountJson | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const cursor = useRef<number>(0);
  const [isSearching, setIsSearching] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const RESULT_LIMIT = 100;

  const handleIdClick = (id: string) => {
    setFormData((prev) => ({ ...prev, id }));
    // スクロールしてフォームを表示
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleFormSubmit = async (data: FormData) => {
    setIsSearching(true);
    setCount(null);
    setFormData(data);
    // 空文字列の値を除外してURLパラメータを設定
    const params: Record<string, string> = {};
    if (data.id) params.id = data.id;
    if (data.main_text) params.main_text = data.main_text;
    if (data.name_and_trip) params.name_and_trip = data.name_and_trip;
    params.ascending = data.ascending.toString(); // ascendingは常に設定
    if (data.since) params.since = data.since;
    if (data.until) params.until = data.until;
    setSearchParams(params);

    if (data.ascending) {
      cursor.current = 0;
    } else {
      cursor.current = 2147483647;
    }

    const searchPromise = fetchData("search", data, cursor.current, true);
    const countPromise = fetchData("search/count", data, cursor.current, true);

    try {
      const response = await searchPromise;

      setResult(response);
      setHasMore(response.length === RESULT_LIMIT);
      cursor.current = response[response.length - 1].no;
    } finally {
      setIsSearching(false);
    }

    const countResponse = await countPromise;
    setCount(countResponse);
  };

  const loadMore = async () => {
    const response = await fetchData("search", formData, cursor.current, true);
    if (response.length < RESULT_LIMIT) {
      setHasMore(false);
      if (response.length === 0) {
        return;
      }
    }
    cursor.current = response[response.length - 1].no;
    setResult([...result, ...response]);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: URL query params are loaded once on page entry.
  useEffect(() => {
    if (searchParams.toString()) {
      handleFormSubmit(formData);
    }
  }, []);

  return (
    <>
      <Header />
      <div className="min-h-screen px-4 py-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="page-title">お絵描きをまとめる機械</h1>
          <div ref={formRef}>
            <Form
              onSubmit={handleFormSubmit}
              defaultValues={formData}
              isSearching={isSearching}
            />
          </div>
          {!isSearching && result.length > 0 && (
            <Result
              result={result}
              count={count}
              hasMore={hasMore}
              loadMore={loadMore}
              onIdClick={handleIdClick}
            />
          )}
        </div>
      </div>
    </>
  );
}

function Result({
  result,
  count,
  loadMore,
  hasMore,
  onIdClick,
}: {
  result: Array<ResJson>;
  count: CountJson | null;
  loadMore: () => void;
  hasMore: boolean;
  onIdClick: (id: string) => void;
}) {
  const loader = (
    <div key="loader" className="flex justify-center py-4">
      <div className="spinner h-8 w-8" />
    </div>
  );

  return (
    <div className="card p-6">
      <Count count={count} />
      <InfiniteScroll
        loadMore={loadMore}
        hasMore={hasMore}
        loader={loader}
        className="space-y-4"
      >
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {result.map((res: ResJson) => (
            <OekakiCard key={res.no} res={res} onIdClick={onIdClick} />
          ))}
        </ul>
      </InfiniteScroll>
    </div>
  );
}

function OekakiCard({
  res,
  onIdClick,
}: { res: ResJson; onIdClick: (id: string) => void }) {
  if (!res.oekaki_id) {
    return null;
  }

  const imageUrl = getImageUrl(res.oekaki_id);

  return (
    <div className="card h-full overflow-hidden">
      <div className="aspect-square border-b border-separator">
        <img
          src={imageUrl}
          alt={res.oekaki_title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <ResMeta res={res} onIdClick={onIdClick} />
        <ResBody res={res} />
        {res.oekaki_title && (
          <div className="mt-1 text-sm text-label">
            タイトル: {res.oekaki_title}
          </div>
        )}
        {res.original_oekaki_res_no && (
          <div className="mt-1 text-sm text-label">
            <NoLink no={res.original_oekaki_res_no} /> この絵を基にしています！
          </div>
        )}
      </div>
    </div>
  );
}
