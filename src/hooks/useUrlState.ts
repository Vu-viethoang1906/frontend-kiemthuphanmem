import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { buildQueryString, parseQuery, QueryParams } from "../utils/query";

export type UrlStateOptions = {
  replace?: boolean; // replaceState thay vì pushState
  basePath?: string; // override path
};

export const useUrlState = <T extends Record<string, any>>(initialState: T = {} as T) => {
  const location = useLocation();
  const navigate = useNavigate();

  const urlState = useMemo(() => {
    const parsed = parseQuery(location.search);
    return { ...initialState, ...parsed } as T;
  }, [location.search, initialState]);

  const setUrlState = useCallback((newState: Partial<T>, replace = false) => {
    const updatedState = { ...urlState, ...newState };
    const qs = buildQueryString(updatedState);
    const url = `${location.pathname}${qs}`;
    navigate(url, { replace });
  }, [urlState, navigate, location.pathname]);

  return [urlState, setUrlState] as const;
};