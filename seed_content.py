#!/usr/bin/env python3
"""Seed GoLearn with real blog posts and courses.

Images are generated as PNGs locally with the stdlib (sandbox has no external
internet), then uploaded through the full media pipeline:
  presign -> PUT to MinIO -> register -> reference as cover_media_id.

Auth: login as admin -> session cookies + gl_csrf cookie.
"""
import hashlib
import struct
import sys
import zlib

import requests

BASE = "http://localhost:8080"
ADMIN_MOBILE = "09121234567"
ADMIN_PASSWORD = "GoLearn2026!"

# Cover palettes keyed by purpose: (bg RGB, band RGB, accent RGB).
PALETTES = {
    "python-cover": ((55, 118, 171), (255, 255, 255), (255, 212, 59)),
    "js-cover": ((247, 223, 30), (50, 50, 50), (50, 50, 50)),
    "design-cover": ((242, 78, 30), (255, 255, 255), (162, 89, 255)),
    "blog-ai-cover": ((16, 163, 127), (255, 255, 255), (16, 163, 127)),
    "blog-web-cover": ((66, 133, 244), (255, 255, 255), (219, 68, 55)),
    "instructor-avatar": ((108, 117, 125), (233, 236, 239), (108, 117, 125)),
}

W, H = 1200, 630


def png_chunk(ctype, data):
    raw = ctype + data
    return struct.pack(">I", len(data)) + raw + struct.pack(">I", zlib.crc32(raw) & 0xFFFFFFFF)


def make_cover(key):
    """Solid background + middle band + bottom accent strip (pure stdlib PNG)."""
    bg, band, accent = PALETTES[key]
    band_y0, band_y1 = H // 2 - 90, H // 2 + 90
    accent_y0 = H - 24
    rows = []
    for y in range(H):
        color = accent if y >= accent_y0 else (band if band_y0 <= y < band_y1 else bg)
        rows.append(b"\x00" + bytes(color) * W)  # filter 0 + RGB
    idat = zlib.compress(b"".join(rows), 9)
    ihdr = struct.pack(">IIBBBBB", W, H, 8, 2, 0, 0, 0)  # 8-bit truecolor RGB
    return (b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", ihdr)
            + png_chunk(b"IDAT", idat) + png_chunk(b"IEND", b""))


def svg(text, fill):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"
 viewBox="0 0 1200 630">
 <rect width="1200" height="630" fill="{fill}"/>
 <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
   font-family="Arial, sans-serif" font-size="48" fill="#ffffff">{text}</text>
</svg>'''.encode("utf-8")


class API:
    def __init__(self):
        self.s = requests.Session()
        self.csrf = ""

    def login(self):
        r = self.s.post(f"{BASE}/api/v1/auth/login",
                        json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD},
                        headers={"Accept": "application/json"})
        print("login:", r.status_code, r.text[:200])
        if r.status_code != 200:
            print("LOGIN FAILED", r.text); sys.exit(1)
        for c in self.s.cookies:
            if c.name == "gl_csrf":
                self.csrf = c.value
        print("csrf:", self.csrf[:16] if self.csrf else "MISSING")

    def _hdr(self, extra=None):
        h = {"Accept": "application/json", "X-CSRF-Token": self.csrf}
        if extra: h.update(extra)
        return h

    def presign(self, mime, size, filename):
        r = self.s.post(f"{BASE}/api/v1/admin/media/presign",
                        json={"mime": mime, "size_bytes": size, "filename": filename},
                        headers=self._hdr())
        if r.status_code != 200:
            raise RuntimeError(f"presign {filename}: {r.status_code} {r.text[:200]}")
        return r.json()

    def register(self, storage_key, filename, mime, size, checksum):
        r = self.s.post(f"{BASE}/api/v1/admin/media",
                        json={"storage_key": storage_key, "filename": filename,
                              "mime": mime, "size_bytes": size, "checksum": checksum},
                        headers=self._hdr())
        if r.status_code not in (200, 201):
            raise RuntimeError(f"register {filename}: {r.status_code} {r.text[:200]}")
        body = r.json()
        return body["id"] if "id" in body else body["data"]["id"]

    def upload_asset(self, key, name, mime, data):
        size = len(data)
        checksum = hashlib.sha256(data).hexdigest()
        print(f"  asset {name}: {size} bytes, {mime}")
        ticket = self.presign(mime, size, name)
        put = requests.put(ticket["upload_url"], data=data,
                           headers={"Content-Type": mime})
        if not (200 <= put.status_code < 300):
            raise RuntimeError(f"PUT {name}: {put.status_code} {put.text[:200]}")
        mid = self.register(ticket["storage_key"], name, mime, size, checksum)
        print(f"    -> media id {mid}")
        return mid

    def instructor_upsert(self, headline, bio, avatar_id, socials):
        r = self.s.put(f"{BASE}/api/v1/admin/instructor",
                       json={"headline": headline, "bio_html": bio,
                             "avatar_media_id": avatar_id, "socials": socials},
                       headers=self._hdr())
        if r.status_code not in (200, 201, 204):
            raise RuntimeError(f"instructor: {r.status_code} {r.text[:300]}")
        print("instructor upsert ok")


    def find_course_category(self, title):
        r = self.s.get(f"{BASE}/api/v1/admin/categories?per_page=100", headers=self._hdr())
        if r.status_code != 200:
            return None
        for c in r.json().get("data", []):
            if c.get("title") == title:
                return c["id"]
        return None

    def find_blog_category(self, title):
        r = self.s.get(f"{BASE}/api/v1/admin/blog-categories?per_page=100", headers=self._hdr())
        if r.status_code != 200:
            return None
        for c in r.json().get("data", []):
            if c.get("title") == title:
                return c["id"]
        return None

    def course_slug_exists(self, slug):
        r = self.s.get(f"{BASE}/api/v1/courses/{slug}")
        return r.status_code == 200

    def post_slug_exists(self, slug):
        r = self.s.get(f"{BASE}/api/v1/blog/posts/{slug}")
        return r.status_code == 200

    def blog_category(self, title, position=0):
        r = self.s.post(f"{BASE}/api/v1/admin/blog-categories",
                        json={"title": title, "position": position},
                        headers=self._hdr())
        if r.status_code not in (200, 201):
            raise RuntimeError(f"blog category {title}: {r.status_code} {r.text[:300]}")
        return self._data_id(r.json())

    @staticmethod
    def _data_id(body):
        if isinstance(body, dict):
            if "data" in body and isinstance(body["data"], dict) and "id" in body["data"]:
                return body["data"]["id"]
            if "id" in body:
                return body["id"]
        raise RuntimeError(f"no id in response: {body}")

    def course_category(self, title, position=0, icon=""):
        r = self.s.post(f"{BASE}/api/v1/admin/categories",
                        json={"title": title, "position": position, "icon": icon},
                        headers=self._hdr())
        if r.status_code not in (200, 201):
            raise RuntimeError(f"course category {title}: {r.status_code} {r.text[:300]}")
        return self._data_id(r.json())

    def create_course(self, payload):
        r = self.s.post(f"{BASE}/api/v1/admin/courses",
                        json=payload, headers=self._hdr())
        if r.status_code not in (200, 201):
            raise RuntimeError(f"create course {payload['title']}: {r.status_code} {r.text[:400]}")
        return self._data_id(r.json())

    def create_section(self, course_id, title, position):
        r = self.s.post(f"{BASE}/api/v1/admin/courses/{course_id}/sections",
                        json={"title": title, "position": position},
                        headers=self._hdr())
        if r.status_code not in (200, 201):
            raise RuntimeError(f"create section: {r.status_code} {r.text[:300]}")
        return self._data_id(r.json())

    def create_lesson(self, section_id, title, position, content="", is_preview=False, status="ready", duration=0):
        r = self.s.post(f"{BASE}/api/v1/admin/sections/{section_id}/lessons",
                        json={"section_id": str(section_id), "title": title, "position": position,
                              "content_html": content, "is_preview": is_preview,
                              "duration_seconds": duration, "status": status,
                              "media_id": None},
                        headers=self._hdr())
        if r.status_code not in (200, 201):
            raise RuntimeError(f"create lesson {title}: {r.status_code} {r.text[:400]}")
        return self._data_id(r.json())

    def publish_course(self, course_id):
        r = self.s.post(f"{BASE}/api/v1/admin/courses/{course_id}/publish",
                        headers=self._hdr())
        if r.status_code not in (200, 201):
            raise RuntimeError(f"publish course: {r.status_code} {r.text[:300]}")

    def create_post(self, payload):
        r = self.s.post(f"{BASE}/api/v1/admin/posts",
                        json=payload, headers=self._hdr())
        if r.status_code not in (200, 201):
            raise RuntimeError(f"create post {payload['title']}: {r.status_code} {r.text[:500]}")
        return self._data_id(r.json())

    def publish_post(self, post_id):
        r = self.s.post(f"{BASE}/api/v1/admin/posts/{post_id}/publish",
                        headers=self._hdr())
        if r.status_code not in (200, 201):
            raise RuntimeError(f"publish post: {r.status_code} {r.text[:300]}")


def main():
    api = API()
    api.login()

    # ---------- 1. Upload generated PNG images ----------
    print("\n== Uploading media (local PNGs) ==")
    media_ids = {}
    for key in PALETTES:
        data = make_cover(key)
        media_ids[key] = api.upload_asset(key, key + ".png", "image/png", data)

    # ---------- 2. Instructor profile ----------
    print("\n== Instructor ==")
    api.instructor_upsert(
        headline="مدرس و توسعه‌دهنده فول‌استک با ۱۰ سال تجربه",
        bio="<p>مدرس توسعه وب و یادگیرنده همیشگوی فناوری. نویسنده دوره‌های برنامه‌نویسی، طراحی و هوش مصنوعی.</p>",
        avatar_id=media_ids["instructor-avatar"],
        socials={"github": "github.com/golearn", "linkedin": "linkedin.com/in/golearn", "website": "https://golearn.ir"},
    )

    # ---------- 3. Course categories ----------
    print("\n== Course categories ==")
    cat_ids = {
        "web": api.find_course_category("توسعه وب") or api.course_category("توسعه وب", 1, "code-2"),
        "python": api.find_course_category("پایتون و هوش مصنوعی") or api.course_category("پایتون و هوش مصنوعی", 2, "cpu"),
        "design": api.find_course_category("طراحی و تجربه کاربری") or api.course_category("طراحی و تجربه کاربری", 3, "layout"),
    }

    # ---------- 4. Courses ----------
    print("\n== Courses ==")
    courses = [
        {
            "title": "آموزش پایتون از صفر تا پیشرفته",
            "slug": "python-zero-to-hero",
            "summary": "دوره جامع پایتون از مفاهیم پایه تا پیشرفته، پروژه‌محور و کاربردی.",
            "description_html": "<h2>دوره جامع پایتون</h2><p>از مفاهیم پایه تا برنامه‌نویسی شیء‌گرا، کار با فایل‌ها، پایگاه داده و ساخت API با FastAPI.</p>",
            "level": "beginner",
            "price_rial": 450000,
            "compare_at_price_rial": 650000,
            "cover_media_id": media_ids["python-cover"],
            "category_ids": [cat_ids["python"]],
            "is_featured": True,
        },
        {
            "title": "جاوا اسکریپت مدرن و React",
            "slug": "modern-javascript-react",
            "summary": "جاوا اسکریپت ES6+ و ساخت برنامه‌های معتبر React.",
            "description_html": "<h2>جاوا اسکریپت مدرن + React</h2><p>async/await، DOM، هوک‌ها، مدیریت حالت و پلتفرم React.</p>",
            "level": "beginner",
            "price_rial": 550000,
            "compare_at_price_rial": None,
            "cover_media_id": media_ids["js-cover"],
            "category_ids": [cat_ids["web"]],
            "is_featured": True,
        },
        {
            "title": "طراحی UI/UX با Figma",
            "slug": "figma-ui-ux-design",
            "summary": "طراحی رابط کاربری و پروتوتایپ با Figma از پایه تا متخصص.",
            "description_html": "<h2>طراحی تجربه کاربری</h2><p>پایه‌های طراحی، شبکه، تایپوگرافی، رنگ و پلتفرم Figma.</p>",
            "level": "beginner",
            "price_rial": 380000,
            "compare_at_price_rial": None,
            "cover_media_id": media_ids["design-cover"],
            "category_ids": [cat_ids["design"]],
            "is_featured": False,
        },
    ]
    course_ids = {}
    for c in courses:
        if api.course_slug_exists(c["slug"]):
            print(f"  course exists, skipping: {c['slug']}")
            r = api.s.get(f"{BASE}/api/v1/courses/{c['slug']}")
            course_ids[c["slug"]] = r.json()["course"]["id"]
            continue
        cid = api.create_course({
            "title": c["title"], "slug": c["slug"], "summary": c["summary"],
            "description_html": c["description_html"], "level": c["level"],
            "price_rial": c["price_rial"],
            "compare_at_price_rial": c["compare_at_price_rial"],
            "prerequisites_html": "<p>الزام پیش‌نیاز ندارد.</p>",
            "outcomes": ["آشنایی با زبان", "ساخت پروژه عملی", "نشر و استقرار"],
            "meta_title": c["title"],
            "meta_description": c["summary"],
            "cover_media_id": c["cover_media_id"],
            "promo_video_media_id": None,
            "is_featured": c["is_featured"],
            "category_ids": c["category_ids"],
        })
        course_ids[c["slug"]] = cid
        print(f"  course {c['title']} -> {cid}")

    # ---------- 5. Sections + lessons per course ----------
    print("\n== Curriculum ==")
    for slug, cid in course_ids.items():
        sec = api.create_section(cid, "بخش اول: مبانی", 1)
        api.create_lesson(sec, "معرفی و نصب ابزارها", 1,
                          content="<p>نصب محیط توسعه و ابزار مورد نیاز.</p>",
                          is_preview=True, duration=600)
        api.create_lesson(sec, "مفاهیم اولیه", 2,
                          content="<p>متغیرها، انواع داده و عملگرها.</p>",
                          is_preview=False, duration=900)
        sec2 = api.create_section(cid, "بخش دوم: پیشرفته", 2)
        api.create_lesson(sec2, "پروژه پایانی", 1,
                          content="<p>ساخت پروژه کاربردی و استقرار.</p>",
                          is_preview=False, duration=1800)

    # ---------- 6. Publish courses ----------
    print("\n== Publishing courses ==")
    for slug, cid in course_ids.items():
        api.publish_course(cid)
        print(f"  published {slug}")

    # ---------- 7. Blog categories ----------
    print("\n== Blog categories ==")
    blog_cat_ids = {
        "tutorials": api.find_blog_category("آموزش‌ها") or api.blog_category("آموزش‌ها", 1),
        "news": api.find_blog_category("اخبار تکنولوژی") or api.blog_category("اخبار تکنولوژی", 2),
        "career": api.find_blog_category("کریر و شغّل") or api.blog_category("کریر و شغّل", 3),
    }

    # ---------- 8. Blog posts ----------
    print("\n== Blog posts ==")
    posts = [
        {
            "title": "معرفی هوش مصنوعی تولید محتوای سال ۲۰۲۶",
            "slug": "generative-ai-2026",
            "excerpt": "بیشترین تغییرات و مدل‌های جدید هوش مصنوعی در سال ۲۰۲۶ و چگونه بر کار ما تاثیر می‌گذارند.",
            "body_html": "<h2>هوش مصنوعی تولید محتوای ۲۰۲۶</h2><p>مدل‌های بزرگ زبان (LLM)، تولید تصویر و کد، و کاربردهای عملی در کسب‌وکار.</p><ul><li>مدل‌های چندگانه-modal</li><li>واسط برنامه‌نویسی (API)</li><li>محدودیت‌ها و اخلاق</li></ul>",
            "cover_media_id": media_ids["blog-ai-cover"],
            "category_id": blog_cat_ids["news"],
            "tag_titles": ["هوش مصنوعی", "LLM", "تکنولوژی"],
            "reading_minutes": 8,
            "featured": True,
        },
        {
            "title": "راه‌اندازی اولین برنامه React با Vite",
            "slug": "react-vite-first-app",
            "excerpt": "ساخت یک اپلیکیشن React سریع و بهینه با Vite در کوتاه‌ترین زمان.",
            "body_html": "<h2>React + Vite</h2><p>نصب Vite، ساخت کامپوننت، مسیرها و استقرار.</p>",
            "cover_media_id": media_ids["blog-web-cover"],
            "category_id": blog_cat_ids["tutorials"],
            "tag_titles": ["React", "Vite", "JavaScript"],
            "reading_minutes": 6,
            "featured": False,
        },
        {
            "title": "مسیر شغّل یک توسعه‌دهنده بک‌اند در ۲۰۲۶",
            "slug": "backend-career-2026",
            "excerpt": "راهنمای کارئری برای یک توسعه‌دهنده بک‌اند: زبان‌ها، فریم‌ورک‌ها و مهارت‌های مورد نیاز.",
            "body_html": "<h2>مسیر شغّل بک‌اند</h2><p>Go، پایتون، Node، پایگاه داده، کانتینر و ابری.</p>",
            "cover_media_id": media_ids["blog-web-cover"],
            "category_id": blog_cat_ids["career"],
            "tag_titles": ["Backend", "Career", "Go", "Python"],
            "reading_minutes": 10,
            "featured": False,
        },
    ]
    post_ids = {}
    for p in posts:
        if api.post_slug_exists(p["slug"]):
            print(f"  post exists, skipping: {p['slug']}")
            continue
        pid = api.create_post({
            "title": p["title"], "slug": p["slug"], "excerpt": p["excerpt"],
            "body_html": p["body_html"], "cover_media_id": p["cover_media_id"],
            "category_id": p["category_id"], "series_id": None, "series_part": None,
            "featured": p["featured"], "og_image_media_id": p["cover_media_id"],
            "meta_title": p["title"], "meta_description": p["excerpt"],
            "tag_titles": p["tag_titles"], "reading_minutes": p["reading_minutes"],
        })
        post_ids[p["slug"]] = pid
        api.publish_post(pid)
        print(f"  post {p['title']} -> {pid} (published)")

    print("\n== DONE ==")
    print("Courses:", course_ids)
    print("Posts:", post_ids)
    print("Media:", media_ids)


if __name__ == "__main__":
    main()
