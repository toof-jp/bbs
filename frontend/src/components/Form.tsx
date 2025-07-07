import { useForm, Controller } from "react-hook-form";
import { useEffect } from "react";

import { FormData } from "../types";

export function Form({
  onSubmit,
  defaultValues,
  isSearching,
}: {
  onSubmit: (data: FormData) => void;
  defaultValues: FormData;
  isSearching: boolean;
}) {
  const { control, handleSubmit, reset } = useForm<FormData>({
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
      <div className="mb-4 flex justify-between items-center">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            順番:
          </label>
          <Controller
            name="ascending"
            control={control}
            render={({ field: { onChange, value } }) => (
              <div className="flex items-center space-x-6">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={value === true}
                    onChange={() => onChange(true)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">古い順</span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={value === false}
                    onChange={() => onChange(false)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">新しい順</span>
                </label>
              </div>
            )}
          />
        </div>
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
