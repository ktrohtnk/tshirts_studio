import cv2
import numpy as np

img = cv2.imread('assets/mask_front.png', cv2.IMREAD_UNCHANGED)
if len(img.shape) == 3 and img.shape[2] == 4:
    alpha = img[:, :, 3]
else:
    # it might be grayscale or RGB, just threshold it
    if len(img.shape) == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, alpha = cv2.threshold(img, 10, 255, cv2.THRESH_BINARY)

rows = np.any(alpha, axis=1)
cols = np.any(alpha, axis=0)
rmin, rmax = np.where(rows)[0][[0, -1]]
cmin, cmax = np.where(cols)[0][[0, -1]]

print(f"Shirt bounding box:")
print(f"Width: {cmax - cmin}px (from {cmin} to {cmax})")
print(f"Height: {rmax - rmin}px (from {rmin} to {rmax})")
