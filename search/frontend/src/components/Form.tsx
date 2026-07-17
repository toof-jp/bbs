import { useForm, Controller } from "react-hook-form";
import { useEffect } from "react";

import type { FormData } from "../types";

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
    <form onSubmit={handleSubmit(onSubmit)} className="card mb-8 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="search-id" className="form-label">
            ID
          </label>
          <Controller
            name="id"
            control={control}
            render={({ field }) => (
              <input {...field} id="search-id" type="text" className="input" />
            )}
          />
        </div>
        <div>
          <label htmlFor="search-name-and-trip" className="form-label">
            名前
          </label>
          <Controller
            name="name_and_trip"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                id="search-name-and-trip"
                type="text"
                className="input"
              />
            )}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="search-main-text" className="form-label">
            本文
          </label>
          <Controller
            name="main_text"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                id="search-main-text"
                type="text"
                className="input"
              />
            )}
          />
        </div>
        <div>
          <label htmlFor="search-since" className="form-label">
            開始
          </label>
          <Controller
            name="since"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                id="search-since"
                type="date"
                className="input"
              />
            )}
          />
        </div>
        <div>
          <label htmlFor="search-until" className="form-label">
            終了
          </label>
          <Controller
            name="until"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                id="search-until"
                type="date"
                className="input"
              />
            )}
          />
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <fieldset>
          <legend className="form-label">順番</legend>
          <Controller
            name="ascending"
            control={control}
            render={({ field: { onChange, value } }) => (
              <div className="flex items-center gap-6">
                <label className="inline-flex cursor-pointer items-center">
                  <input
                    type="radio"
                    checked={value === true}
                    onChange={() => onChange(true)}
                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">
                    古い順
                  </span>
                </label>
                <label className="inline-flex cursor-pointer items-center">
                  <input
                    type="radio"
                    checked={value === false}
                    onChange={() => onChange(false)}
                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">
                    新しい順
                  </span>
                </label>
              </div>
            )}
          />
        </fieldset>
        <button type="submit" disabled={isSearching} className="btn-primary">
          {isSearching ? (
            <>
              <div className="spinner h-4 w-4 border-white/40 border-t-white" />
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
