export function NoLink({ no }: { no: number }) {
  const pageNo = Math.floor((no - 1) / 30) * 30 + 1;
  const url = `https://dic.nicovideo.jp/b/c/ch2598430/${pageNo}-#${no}`;
  return (
    <a
      href={url}
      target="_blank"
      className="text-blue-600 hover:text-blue-800 hover:underline"
    >
      {no}
    </a>
  );
}
