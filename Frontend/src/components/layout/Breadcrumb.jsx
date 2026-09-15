import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-1.5">
        <li className="inline-flex items-center">
          <Link to="/" className="inline-flex items-center text-[10px] font-medium text-slate-400 hover:text-blue-600">
            MediSync AI
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;

          // Format segment title
          let formattedValue = value.replace(/-/g, ' ');
          // Capitalize
          formattedValue = formattedValue.charAt(0).toUpperCase() + formattedValue.slice(1);

          return (
            <li key={to}>
              <div className="flex items-center">
                <span className="text-slate-300 text-[10px] mx-1">/</span>
                {last ? (
                  <span className="text-[10px] font-semibold text-slate-500 capitalize" aria-current="page">
                    {formattedValue}
                  </span>
                ) : (
                  <Link
                    to={to}
                    className="text-[10px] font-medium text-slate-400 hover:text-blue-600 capitalize"
                  >
                    {formattedValue}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
