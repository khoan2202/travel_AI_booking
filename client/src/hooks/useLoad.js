// Hook tải dữ liệu dùng chung: truyền vào hàm load (bọc bằng useCallback),
// hàm load đổi thì tự tải lại và tự hủy yêu cầu cũ.
import { useEffect, useState } from "react";

export default function useLoad(load) {
  // Lưu kèm hàm load đã tạo ra kết quả, để biết kết quả đang có còn đúng với bộ lọc hiện tại không.
  const [state, setState] = useState({ load: null, data: null, error: "" });

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setState({ load, data, error: "" }); })
      .catch((error) => { if (!controller.signal.aborted) setState({ load, data: null, error: error.message }); });
    return () => controller.abort();
  }, [load]);

  // Trong lúc tải lại vẫn giữ dữ liệu cũ trên màn hình để trang không bị nháy.
  return { data: state.data, error: state.error, loading: state.load !== load };
}
