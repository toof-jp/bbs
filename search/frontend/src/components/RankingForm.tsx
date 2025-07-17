import { useForm, Controller } from "react-hook-form";
import { useEffect } from "react";

export interface RankingFormData {
  id: string;
  main_text: string;
  name_and_trip: string;
  since: string;
  until: string;
}

export function RankingForm({
  onSubmit,
  defaultValues,
  isSearching,
}: {
  onSubmit: (data: RankingFormData) => void;
  defaultValues: RankingFormData;
  isSearching: boolean;
}) {
  const { control, handleSubmit, reset } = useForm<RankingFormData>({
    defaultValues: defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white shadow-md rounded-lg p-6 mb-8"
    >
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          ID:
          <Controller
            name="id"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            )}
          />
        </label>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          名前:
          <Controller
            name="name_and_trip"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            )}
          />
        </label>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          本文:
          <Controller
            name="main_text"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            )}
          />
        </label>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          開始:
          <Controller
            name="since"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="date"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            )}
          />
        </label>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          終了:
          <Controller
            name="until"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="date"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            )}
          />
        </label>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSearching}
          className={`
            flex items-center px-4 py-2 rounded
            ${
              isSearching
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-700"
            }
            text-white font-bold focus:outline-none focus:shadow-outline
          `}
        >
          {isSearching ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              検索中...
            </>
          ) : (
            "検索"
          )}
        </button>
      </div>
    </form>
  );
}