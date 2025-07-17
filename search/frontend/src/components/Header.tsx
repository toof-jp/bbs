import { Link, useLocation } from "react-router-dom";

export function Header() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const getLinkClassName = (path: string) => {
    const baseClass = "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium";
    return isActive(path)
      ? `${baseClass} border-blue-500 text-gray-900`
      : `${baseClass} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`;
  };
  
  return (
    <header className="bg-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex space-x-8">
              <Link
                to="/"
                className={getLinkClassName("/")}
              >
                掲示板検索
              </Link>
              <Link
                to="/oekaki"
                className={getLinkClassName("/oekaki")}
              >
                お絵かきをまとめる機械
              </Link>
              <Link
                to="/ranking"
                className={getLinkClassName("/ranking")}
              >
                IDランキング
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
