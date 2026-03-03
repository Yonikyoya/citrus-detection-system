import colorsys
from dataclasses import dataclass


@dataclass(frozen=True)
class ColorMaturityResult:
    hue_cv: float
    maturity: float
    label: str


def maturity_from_hue_cv(hue_cv: float) -> ColorMaturityResult:
    hue_cv = float(hue_cv)
    if hue_cv >= 60.0:
        maturity = 40.0
    elif hue_cv >= 30.0:
        maturity = 100.0 - hue_cv
    elif hue_cv >= 20.0:
        maturity = 130.0 - 2.0 * hue_cv
    else:
        maturity = 90.0
    if maturity < 10.0:
        maturity = 10.0
    if maturity > 95.0:
        maturity = 95.0
    maturity = round(maturity, 1)

    if maturity >= 80.0:
        label = "橙色成熟"
    elif maturity >= 55.0:
        label = "转色中"
    else:
        label = "偏青"

    return ColorMaturityResult(hue_cv=round(hue_cv, 2), maturity=maturity, label=label)


def maturity_from_rgb(r: int, g: int, b: int) -> ColorMaturityResult:
    r = int(r)
    g = int(g)
    b = int(b)
    rf = max(0.0, min(1.0, r / 255.0))
    gf = max(0.0, min(1.0, g / 255.0))
    bf = max(0.0, min(1.0, b / 255.0))
    h, s, v = colorsys.rgb_to_hsv(rf, gf, bf)
    if s < 0.08 or v < 0.08:
        return ColorMaturityResult(hue_cv=-1.0, maturity=0.0, label="未知")
    hue_deg = h * 360.0
    hue_cv = hue_deg / 2.0
    return maturity_from_hue_cv(hue_cv)

