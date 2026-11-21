// Trình soạn bài (/admin/blog/new và /admin/blog/:id): có thanh định dạng, xem trước, ảnh bìa, hẹn giờ đăng.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import AdminNav from "../components/AdminNav.jsx";
import MarkdownContent from "../components/MarkdownContent.jsx";
import useLoad from "../hooks/useLoad.js";
import { deletePost, getAdminPost, getDestinations, savePost } from "../services/adminApi.js";
import { destinationImages } from "../data/destinationImages.js";
import { BLOG_CATEGORIES, POST_STATUSES, readingMinutes, slugify } from "../utils/blog.js";
import { parseMarkdown } from "../utils/markdown.js";

const EMPTY = { title: "", slug: "", excerpt: "", content: "", cover_image: "", category: "guide", tags: "", destination_id: "", author_name: "Travel Mint", status: "draft", featured: false, published_at: "" };

// ảnh có sẵn để chọn làm ảnh bìa
const COVERS = Object.entries(destinationImages).flatMap(([name, images]) => images.gallery.map((photo, index) => ({ src: photo.src, label: `${name} ${index + 1}` })));

// giờ trong DB sang giá trị cho ô chọn ngày giờ (theo giờ máy)
function toLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

// mỗi nút chèn ký hiệu Markdown vào chỗ con trỏ
const TOOLS = [
  { label: "Tiêu đề", title: "Tiêu đề mục", before: "\n## ", after: "\n", sample: "Tiêu đề mục" },
  { label: "Đậm", title: "Chữ đậm", before: "**", after: "**", sample: "chữ đậm" },
  { label: "Nghiêng", title: "Chữ nghiêng", before: "*", after: "*", sample: "chữ nghiêng" },
  { label: "Danh sách", title: "Danh sách", before: "\n- ", after: "\n", sample: "Mục danh sách" },
  { label: "Trích dẫn", title: "Trích dẫn", before: "\n> ", after: "\n", sample: "Lời nhắn nổi bật" },
  { label: "Link", title: "Chèn link", before: "[", after: "](https://)", sample: "chữ hiển thị" },
  { label: "Ảnh", title: "Chèn ảnh", before: "\n![Mô tả ảnh](", after: ")\n", sample: "/images/destinations/hoi-an-2.jpg" },
];

function Editor({ initial, destinations, startNotice }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(startNotice);
  const [confirming, setConfirming] = useState(false);
  // điện thoại chỉ đủ chỗ cho một khung: soạn hoặc xem trước
  const [mobileView, setMobileView] = useState("write");
  const areaRef = useRef(null);
  const blocks = useMemo(() => parseMarkdown(form.content), [form.content]);

  // chưa lưu mà đóng tab thì trình duyệt hỏi lại
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function change(key, value) { setForm((current) => ({ ...current, [key]: value })); setDirty(true); }

  // bài mới thì slug theo tiêu đề, bài cũ giữ nguyên slug để link không gãy
  function changeTitle(title) {
    setForm((current) => ({ ...current, title, slug: current.id ? current.slug : slugify(title) }));
    setDirty(true);
  }

  // chèn vào đúng chỗ đang chọn trong ô soạn
  function applyTool(tool) {
    const area = areaRef.current;
    const start = area.selectionStart, end = area.selectionEnd;
    const selected = form.content.slice(start, end) || tool.sample;
    const content = form.content.slice(0, start) + tool.before + selected + tool.after + form.content.slice(end);
    change("content", content);
    // đợi React vẽ xong rồi mới bôi đen phần vừa chèn
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(start + tool.before.length, start + tool.before.length + selected.length);
    });
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const body = {
        ...form,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        destination_id: form.destination_id ? Number(form.destination_id) : null,
        published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      };
      const saved = await savePost(form.id, body);
      setDirty(false);
      if (!form.id) { navigate(`/admin/blog/${saved.id}`, { replace: true, state: { notice: "Đã tạo bài viết." } }); return; }
      setForm((current) => ({ ...current, published_at: toLocalInput(saved.published_at) }));
      setNotice("Đã lưu bài viết.");
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true); setError("");
    try { await deletePost(form.id); setDirty(false); navigate("/admin/blog", { replace: true }); }
    catch (err) { setError(err.message); setBusy(false); setConfirming(false); }
  }

  const scheduled = form.status === "published" && form.published_at && new Date(form.published_at) > new Date();

  return <form className="admin-form post-editor" onSubmit={submit}><fieldset disabled={busy}>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {notice && <p className="auth-success" role="status">{notice}</p>}

    <div className="post-editor-grid">
      <div className="post-editor-main">
        <label>Tiêu đề<input required minLength="5" maxLength="200" value={form.title} onChange={(event) => changeTitle(event.target.value)} /></label>
        <label>Tóm tắt (hiện trên thẻ bài viết)<textarea required minLength="20" maxLength="400" rows="3" value={form.excerpt} onChange={(event) => change("excerpt", event.target.value)} /></label>

        <div className="post-write-head">
          <span id="post-content-label">Nội dung</span>
          <div className="post-view-switch" role="group" aria-label="Chế độ xem">
            <button type="button" aria-pressed={mobileView === "write"} onClick={() => setMobileView("write")}>Soạn</button>
            <button type="button" aria-pressed={mobileView === "preview"} onClick={() => setMobileView("preview")}>Xem trước</button>
          </div>
        </div>
        <div className={`post-write is-${mobileView}`}>
          <div className="post-write-pane">
            <div className="post-tools" role="toolbar" aria-label="Định dạng">
              {TOOLS.map((tool) => <button key={tool.label} type="button" title={tool.title} onClick={() => applyTool(tool)}>{tool.label}</button>)}
            </div>
            <textarea ref={areaRef} aria-labelledby="post-content-label" required minLength="50" maxLength="50000" rows="22" value={form.content} onChange={(event) => change("content", event.target.value)} placeholder={"## Mở đầu\n\nViết nội dung bài ở đây…"} />
            <p className="admin-hint">{form.content.length.toLocaleString("vi-VN")} / 50.000 ký tự · khoảng {readingMinutes(form.content.length)} phút đọc</p>
          </div>
          <div className="post-preview" aria-label="Xem trước bài viết">
            <p className="post-preview-label">Xem trước</p>
            {blocks.length ? <MarkdownContent blocks={blocks} /> : <p className="admin-hint">Nội dung xem trước sẽ hiện ở đây.</p>}
          </div>
        </div>
      </div>

      <aside className="post-editor-side">
        <section>
          <h2>Đăng bài</h2>
          <label>Trạng thái<select value={form.status} onChange={(event) => change("status", event.target.value)}>{Object.entries(POST_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          {form.status === "published" && <label>Ngày đăng (để trống là đăng ngay)<input type="datetime-local" value={form.published_at} onChange={(event) => change("published_at", event.target.value)} /></label>}
          {scheduled && <p className="admin-hint">Bài sẽ tự hiện ra khi tới thời gian đã chọn.</p>}
          <label className="manual-confirm"><input type="checkbox" checked={form.featured} onChange={(event) => change("featured", event.target.checked)} /> Đặt làm bài nổi bật</label>
          <button className="button button-primary post-save">{busy ? "Đang lưu…" : form.id ? "Lưu thay đổi" : "Tạo bài viết"}</button>
          {form.id && form.status === "published" && !scheduled && <Link className="button button-secondary post-save" to={`/blog/${form.slug}`}>Xem bài trên website</Link>}
        </section>

        <section>
          <h2>Ảnh bìa</h2>
          {form.cover_image && <img className="post-cover-preview" src={form.cover_image} alt="Ảnh bìa đã chọn" />}
          <label>Chọn ảnh có sẵn<select value={COVERS.some((cover) => cover.src === form.cover_image) ? form.cover_image : ""} onChange={(event) => change("cover_image", event.target.value)}>
            <option value="">Không dùng ảnh có sẵn</option>{COVERS.map((cover) => <option key={cover.src} value={cover.src}>{cover.label}</option>)}
          </select></label>
          <label>Hoặc dán link ảnh HTTPS<input maxLength="2000" value={form.cover_image} onChange={(event) => change("cover_image", event.target.value)} placeholder="https://…" /></label>
        </section>

        <section>
          <h2>Phân loại</h2>
          <label>Chuyên mục<select value={form.category} onChange={(event) => change("category", event.target.value)}>{Object.entries(BLOG_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Điểm đến (để gợi ý tour cuối bài)<select value={form.destination_id} onChange={(event) => change("destination_id", event.target.value)}><option value="">Không gắn điểm đến</option>{destinations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Tag, ngăn cách bằng dấu phẩy<input value={form.tags} onChange={(event) => change("tags", event.target.value)} placeholder="biển, gia đình" /></label>
          <label>Slug (đường dẫn)<input required maxLength="220" pattern="[a-z0-9]+(-[a-z0-9]+)*" title="Chữ thường không dấu, số và dấu gạch ngang" value={form.slug} onChange={(event) => change("slug", event.target.value)} /></label>
          <label>Tác giả<input required minLength="2" maxLength="100" value={form.author_name} onChange={(event) => change("author_name", event.target.value)} /></label>
        </section>

        {form.id && <section className="post-danger">
          <h2>Xóa bài viết</h2>
          {confirming ? <>
            <p className="admin-hint">Bài viết sẽ bị xóa vĩnh viễn và không khôi phục được.</p>
            <div className="admin-row-actions"><button className="button button-danger" type="button" onClick={remove}>Xóa vĩnh viễn</button><button className="button button-secondary" type="button" onClick={() => setConfirming(false)}>Giữ lại</button></div>
          </> : <button className="button button-secondary" type="button" onClick={() => setConfirming(true)}>Xóa bài này</button>}
        </section>}
      </aside>
    </div>
  </fieldset></form>;
}

export default function AdminBlogEditorPage() {
  const { id } = useParams();
  const location = useLocation();
  const load = useCallback(async (signal) => {
    const [destinations, post] = await Promise.all([getDestinations(signal), id ? getAdminPost(id, signal) : null]);
    return { destinations, post };
  }, [id]);
  const { data, error, loading } = useLoad(load);
  // đổi dữ liệu từ DB sang dạng các ô nhập cần
  const initial = data?.post ? {
    ...data.post, tags: data.post.tags.join(", "), cover_image: data.post.cover_image || "",
    destination_id: data.post.destination_id ? String(data.post.destination_id) : "", published_at: toLocalInput(data.post.published_at),
  } : EMPTY;

  return <><Header /><main className="container admin-page"><AdminNav />
    <p className="section-kicker"><Link to="/admin/blog">← BÀI VIẾT BLOG</Link></p>
    <h1>{id ? "Sửa bài viết" : "Viết bài mới"}</h1>
    {error ? <div className="state-box" role="alert"><p>{error}</p><Link className="button button-secondary" to="/admin/blog">Về danh sách</Link></div>
      : loading || !data ? <p role="status">Đang mở trình soạn thảo…</p>
      : <Editor key={id || "new"} initial={initial} destinations={data.destinations} startNotice={location.state?.notice || ""} />}
  </main><Footer /></>;
}
