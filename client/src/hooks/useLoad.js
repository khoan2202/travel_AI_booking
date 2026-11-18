// Hook tải dữ liệu dùng chung. Đưa vào hàm load (bọc useCallback): hàm đổi thì tự tải lại và hủy yêu cầu cũ.
// refreshKey là số đếm để ép tải lại khi hàm load không đổi (nút "Thử lại").
//   const load = useCallback((signal) => getTour(id, signal), [id]);
//   const { data, error, loading } = useLoad(load, retryCount);
import { useEffect, useState } from "react";

export default function useLoad(load, refreshKey = 0) {
  // lưu kèm load và refreshKey đã sinh ra kết quả, để biết kết quả đang có còn đúng với yêu cầu hiện tại không
  const [state, setState] = useState({ load: null, key: null, data: null, error: "" });

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setState({ load, key: refreshKey, data, error: "" }); })
      .catch((error) => { if (!controller.signal.aborted) setState({ load, key: refreshKey, data: null, error: error.message }); });
    return () => controller.abort();
  }, [load, refreshKey]);

  // đang tải lại thì vẫn để dữ liệu cũ trên màn hình cho khỏi nháy, còn lỗi lần trước thì ẩn đi
  const current = state.load === load && state.key === refreshKey;
  return { data: state.data, error: current ? state.error : "", loading: !current };
}
