import cv2
import numpy as np

img = cv2.imread('assets/outer_collar.png')
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

# The background is likely grey, and the shirt is white.
# Let's try to isolate the white shirt.
lower_white = np.array([0, 0, 150])
upper_white = np.array([180, 50, 255])

mask = cv2.inRange(hsv, lower_white, upper_white)

# Clean up the mask
kernel = np.ones((5,5), np.uint8)
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

# Find the largest contour
contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
if contours:
    largest_contour = max(contours, key=cv2.contourArea)
    clean_mask = np.zeros_like(mask)
    cv2.drawContours(clean_mask, [largest_contour], -1, 255, -1)
    
    clean_mask = cv2.GaussianBlur(clean_mask, (15,15), 0)
    _, clean_mask = cv2.threshold(clean_mask, 127, 255, cv2.THRESH_BINARY)
    
    out = np.zeros((img.shape[0], img.shape[1], 4), dtype=np.uint8)
    out[:,:,3] = clean_mask
    cv2.imwrite('assets/mask_collar.png', out)
    print("Mask updated.")
else:
    print("No contours found.")
