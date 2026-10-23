# tAI Console

Dashboard **tAI — Threads Affiliate AI**, thiết kế theo [dashboard-designer](https://github.com/nickcrew/claude-cortex/blob/main/skills/dashboard-designer/SKILL.md) (MIT).

## Kiến trúc

- **Frontend**: Cloudflare Pages, static HTML + CSS + JavaScript thuần. Không cần React/npm/backend Cloudflare.
- **Backend**: Supabase Postgres, Auth, Storage, Edge Functions, Cron (cấu hình riêng).
- **Publishing**: Upload-Post Hosted MCP, **chỉ gọi từ Supabase Edge Functions**, không gọi trực tiếp từ trình duyệt.
- **AI**: model/provider chỉ là cấu hình dashboard; thực thi/fallback và API keys xử lý phía backend Supabase.

## Chức năng frontend hiện có

- Tổng quan 4 KPI: bài đã đăng, lượt xem, lượt tương tác, hàng đợi.
- Biểu đồ xu hướng, phễu bài đăng, bảng bài gần đây, nhật ký.
- Xem/lọc/tìm bài đăng; tạo bản nháp; xem/tạo sản phẩm.
- Cấu hình model, fallback, prompt, giới hạn bài/ngày, tự động hóa/duyệt trước khi đăng.
- Cấu hình Supabase URL + public publishable/anon key, đăng nhập email/password.
- Demo mode có ghi nhãn rõ khi Supabase chưa kết nối.
- Responsive cho desktop/tablet/mobile.

### Chưa có (cần triển khai backend)

- Sinh bài trực tiếp với Gemini/Groq/Workers AI.
- Cron chạy theo lịch, thật sự gọi Upload-Post MCP, kiểm tra job và đồng bộ metrics.
- Auto publishing toggle **chỉ lưu cấu hình**. Frontend không đăng Threads.
- Analytics thực tế phụ thuộc dữ liệu `posts.views/likes/...` được backend đồng bộ.

## Chạy local

Không cần cài package, mở `index.html` hoặc phục vụ folder bằng:

```bash
python3 -m http.server 8080
```

Mở http://localhost:8080.

## Thiết lập Supabase

1. Tạo project Supabase, trong SQL Editor chạy `supabase/schema.sql`.
2. Bật Supabase Auth → Email, tạo user quản trị.
3. Đảm bảo Data API expose bảng `public` và cấp quyền `authenticated` (thường là mặc định).
4. Mở dashboard → **Cài đặt & Kết nối**, điền `https://<project>.supabase.co` và **publishable key** (hoặc anon key cũ).
5. Đăng nhập bằng email/mật khẩu.

**Lưu ý bảo mật:** Không bao giờ điền `service_role` hoặc `sb_secret_...`. Các khóa AI/Upload-Post phải nằm trong Supabase Edge Functions Secrets. Frontend dùng RLS và key công khai. Session hiện lưu trong `sessionStorage`, key công khai lưu trong `localStorage`.

## Deploy Cloudflare Pages

### Git integration (khuyến nghị)

1. Push folder này vào repository riêng `tAI` (branch `main`).
2. Cloudflare Pages → Create project → Connect to GitHub → chọn repo `tAI`.
3. Framework preset: `None`; build command: *(để trống)*; output directory: `/` (repo root).
4. Deploy. Thay đổi mã nguồn sẽ tự động triển khai khi push.

### Direct Upload

Có thể upload toàn bộ file tĩnh lên Cloudflare Pages qua Wrangler:

```bash
npx wrangler pages deploy . --project-name=tai-console
```

**Không** upload thư mục `supabase/` nếu deploy direct upload toàn folder; chỉ upload các file frontend. Có thể copy `index.html`, `styles.css`, `app.js`, `favicon.svg`, `_headers` sang một thư mục `public/` để deploy.

## Data model

Bảng `products`, `posts`, `app_settings`, `job_logs`. Tất cả theo `user_id`; RLS hạn chế truy cập theo `auth.uid()`.

## Triết lý thiết kế

Dành cho người quản trị tAI kiểm tra hàng ngày: KPI có thể hành động, layout F-pattern, màu tiết chế, filters đầu trang, trạng thái rõ ràng, không dựng số liệu ảo dưới dạng thật.

## License

Mã ứng dụng tAI Console phát triển trong phiên làm việc này để bạn tùy chỉnh. Skill tham khảo có license MIT.

## GitHub Pages deployment

Cloudflare Pages: chọn GitHub repository `LuuDinhTheTai/tAI`, production branch `main`, no framework preset, build command để trống, output directory `/` (root). Source files ở root repository.

**Chú ý:** Supabase chưa có project cấu hình; frontend chỉ hiển thị demo cho đến khi thiết lập `SUPABASE_URL` và public anon/publishable key trong ứng dụng. Không đưa service-role key hoặc Upload-Post API key vào client.
