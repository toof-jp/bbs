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
    <form onSubmit={handleSubmit(onSubmit)} className="card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ranking-id" className="form-label">
            ID
          </label>
          <Controller
            name="id"
            control={control}
            render={({ field }) => (
              <input {...field} id="ranking-id" type="text" className="input" />
            )}
          />
        </div>
        <div>
          <label htmlFor="ranking-name-and-trip" className="form-label">
            名前
          </label>
          <Controller
            name="name_and_trip"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                id="ranking-name-and-trip"
                type="text"
                className="input"
              />
            )}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="ranking-main-text" className="form-label">
            本文
          </label>
          <Controller
            name="main_text"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                id="ranking-main-text"
                type="text"
                className="input"
              />
            )}
          />
        </div>
        <div>
          <label htmlFor="ranking-since" className="form-label">
            開始
          </label>
          <Controller
            name="since"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                id="ranking-since"
                type="date"
                className="input"
              />
            )}
          />
        </div>
        <div>
          <label htmlFor="ranking-until" className="form-label">
            終了
          </label>
          <Controller
            name="until"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                id="ranking-until"
                type="date"
                className="input"
              />
            )}
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
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
