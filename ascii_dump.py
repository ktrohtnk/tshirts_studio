import cv2
import numpy as np
img = cv2.imread('assets/outer_collar.png')
# resize to 32x32 for ascii
small = cv2.resize(img, (64, 64))
gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)

chars = " .:-=+*#%@"
for row in gray:
    line = ""
    for val in row:
        idx = int(val / 256 * len(chars))
        line += chars[idx] * 2
    print(line)
