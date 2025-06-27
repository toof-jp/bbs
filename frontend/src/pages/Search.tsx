import { useState, useRef, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroller";
import { useSearchParams } from "react-router-dom";

import { ResJson, CountJson, FormData } from "../types";
import { fetchData, BASE_URL } from "../utils/Fetch";
import { Form } from "../components/Form";
import { Count } from "../components/Count";
import { NoLink } from "../components/NoLink";
import { Header } from "../components/Header";

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

  const RESULT_LIMIT = 100;

  const handleFormSubmit = async (data: FormData) => {
    setIsSearching(true);
    setCount(null);
    setFormData(data);
    setSearchParams({
      id: data.id,
      main_text: data.main_text,
      name_and_trip: data.name_and_trip,
      ascending: data.ascending.toString(),
      since: data.since,
      until: data.until,
    });

    if (data.ascending) {
      cursor.current = 0;
    } else {
      cursor.current = 2147483647;
    }

    const searchPromise = fetchData("search", data, cursor.current);
    const countPromise = fetchData("search/count", data, cursor.current);

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
    let response = await fetchData("search", formData, cursor.current);
    if (response.length < RESULT_LIMIT) {
      setHasMore(false);
      if (response.length === 0) {
        return;
      }
    }
    cursor.current = response[response.length - 1].no;
    setResult([...result, ...response]);
  };

  useEffect(() => {
    if (searchParams.toString()) {
      handleFormSubmit(formData);
    }
  }, []);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            掲示板検索
          </h1>
          <Form
            onSubmit={handleFormSubmit}
            defaultValues={formData}
            isSearching={isSearching}
          />
          {!isSearching && result.length > 0 && (
            <Result
              result={result}
              count={count}
              hasMore={hasMore}
              loadMore={loadMore}
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
}: {
  result: Array<ResJson>;
  count: CountJson | null;
  loadMore: () => void;
  hasMore: boolean;
}) {
  const loader = (
    <div key="loader" className="flex justify-center py-4 text-gray-600">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
    </div>
  );

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <Count count={count} />
      <InfiniteScroll
        loadMore={loadMore}
        hasMore={hasMore}
        loader={loader}
        className="space-y-4"
      >
        <ul className="divide-y divide-gray-200">
          {result.map((res: ResJson) => (
            <Res key={res.no} res={res} />
          ))}
        </ul>
      </InfiniteScroll>
    </div>
  );
}

function Res({ res }: { res: ResJson }) {
  return (
    <li className="py-4">
      <div className="text-sm text-gray-600 mb-2">
        <NoLink no={res.no} /> <div className="inline">{res.name_and_trip}</div>{" "}
        <div className="inline">{res.datetime_text}</div>{" "}
        <div className="inline">ID: {res.id}</div>
      </div>
      <div
        className="text-gray-800 prose prose-sm max-w-none prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline"
        dangerouslySetInnerHTML={{ __html: res.main_text_html }}
      />
      {res.oekaki_id && <Oekaki res={res} />}
    </li>
  );
}

function Oekaki({ res }: { res: ResJson }) {
  const imageUrl = `${BASE_URL}/images/${res.oekaki_id}.png`;
  return (
    <div className="mt-2 prose prose-sm">
      <img src={imageUrl} alt={res.oekaki_title} className="max-w-full" />
      {res.oekaki_title && (
        <div className="text-gray-800">タイトル: {res.oekaki_title}</div>
      )}
      {res.original_oekaki_res_no && (
        <div className="text-gray-800">
          <NoLink no={res.original_oekaki_res_no} /> この絵を基にしています！
        </div>
      )}
    </div>
  );
}
