"""
상태바 알림 아이콘(구글 플레이 등) 제거 스크립트
- 상태바 왼쪽 아이콘 영역을 주변 픽셀 색으로 채움
- 시간(오른쪽)과 배터리/신호(오른쪽)는 그대로 유지
"""
from PIL import Image, ImageFilter
import os, glob

SCREENSHOTS_DIR = os.path.join(os.path.dirname(__file__), "../../assets/screenshots")

def remove_statusbar_icons(img_path):
    img = Image.open(img_path).convert("RGB")
    w, h = img.size

    # 상태바 높이 (1080px 기준 약 70px, 비율로 계산)
    bar_h = int(h * 70 / 2640)

    # 아이콘 영역: 시간 텍스트(약 x=0~200) 오른쪽부터 중앙까지
    # 시간은 왼쪽 약 0~220px 유지, 오른쪽 배터리/신호도 유지
    # 가운데 알림 아이콘 영역(x: 220~540) 을 배경색으로 채움
    icon_x_start = int(w * 220 / 1080)
    icon_x_end   = int(w * 540 / 1080)

    # 배경색: 상태바 좌측 끝 픽셀 색 샘플
    bg_color = img.getpixel((icon_x_start - 10, bar_h // 2))

    # 해당 영역 채우기
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)
    draw.rectangle(
        [icon_x_start, 0, icon_x_end, bar_h],
        fill=bg_color
    )

    img.save(img_path, quality=95)
    print(f"  처리: {os.path.basename(img_path)}  bg={bg_color}")

if __name__ == "__main__":
    files = sorted(glob.glob(os.path.join(SCREENSHOTS_DIR, "*.jpg")))
    print(f"처리할 스크린샷: {len(files)}장")
    for f in files:
        remove_statusbar_icons(f)
    print("완료")
