// Kho chung các tour đang chọn để so sánh (tối đa 3). Provider ở CompareProvider.jsx.
// const { items, toggle, has } = useCompare();
import { createContext, useContext } from "react";

export const COMPARE_LIMIT = 3;

export const CompareContext = createContext(null);

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare phải nằm trong CompareProvider.");
  return context;
}
