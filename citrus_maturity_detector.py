import os
from ultralytics import YOLO
import cv2

model = YOLO("runs/detect/train5/weights/best.pt")

MATURITY_RANGES = {
    "unripe_orange": (0, 60),
    "ripe_orange": (60, 95),
    "rotten_orange": (95, 100)
}

def calculate_maturity(class_name, conf):
    low, high = MATURITY_RANGES[class_name]
    return round(low + conf * (high - low), 1)

def predict_days_to_ripe(maturity):
    return max(0, round((100 - maturity) / 5))


# 🔹 输入图片文件夹
image_folder = r"D:\citrus_dataset\images\test"   # 放你要检测的图片

for filename in os.listdir(image_folder):
    if filename.endswith((".jpg", ".png", ".jpeg")):
        image_path = os.path.join(image_folder, filename)
        results = model(image_path)

        for r in results:
            img = r.orig_img.copy()
            boxes = r.boxes

            for box in boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                class_name = model.names[cls_id]

                maturity = calculate_maturity(class_name, conf)
                days = predict_days_to_ripe(maturity)

                x1, y1, x2, y2 = map(int, box.xyxy[0])
                label = f"{maturity}% | {days} days"

                cv2.rectangle(img, (x1, y1), (x2, y2), (0,255,0), 2)
                cv2.putText(img, label, (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)

            cv2.imshow("Result", img)
            cv2.waitKey(0)

cv2.destroyAllWindows()
