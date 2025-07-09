import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="bg-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex space-x-8">
              <Link
                to="/"
                className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-700"
              >
                掲示板検索
              </Link>
              <Link
                to="/oekaki"
                className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-700"
              >
                お絵かきをまとめる機械
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
