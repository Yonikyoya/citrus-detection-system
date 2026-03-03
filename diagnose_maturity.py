import argparse
import csv
import os
import sys


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("paths", nargs="+")
    parser.add_argument("--model", default=os.environ.get("MODEL_PATH", "yolov10n.pt"))
    args = parser.parse_args()

    import cv2
    from ultralytics import YOLO
    from maturity import maturity_from_hue_cv

    model = YOLO(args.model)

    writer = csv.writer(sys.stdout)
    writer.writerow(["image", "class", "conf", "hue_cv_mean", "maturity_color", "label"])

    for p in args.paths:
        img = cv2.imread(p)
        if img is None:
            writer.writerow([p, "", "", "", "", "READ_FAIL"])
            continue
        results = model(p)
        r0 = results[0]
        boxes = r0.boxes
        if boxes is None or len(boxes) == 0:
            writer.writerow([p, "", "", "", "", "NO_DETECTION"])
            continue

        best_box = max(boxes, key=lambda b: float(b.conf[0]))
        class_id = int(best_box.cls[0])
        class_name = model.names[class_id]
        conf = float(best_box.conf[0])

        x1, y1, x2, y2 = map(int, best_box.xyxy[0])
        fruit = img[y1:y2, x1:x2]
        hsv = cv2.cvtColor(fruit, cv2.COLOR_BGR2HSV)
        hue_cv_mean = float(hsv[:, :, 0].mean())
        cm = maturity_from_hue_cv(hue_cv_mean)

        writer.writerow([p, class_name, f"{conf:.6f}", f"{cm.hue_cv:.2f}", f"{cm.maturity:.1f}", cm.label])


if __name__ == "__main__":
    main()

