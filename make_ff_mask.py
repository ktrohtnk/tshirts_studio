import cv2
import numpy as np

# Load image
img = cv2.imread('assets/outer_collar.png')
h, w = img.shape[:2]

# Create a mask for floodfill. It needs to be 2 pixels larger than image
ff_mask = np.zeros((h+2, w+2), np.uint8)

# Floodfill from bottom center (x=w//2, y=h-10)
# We expect the bottom center to be the white T-shirt fabric.
seed_pt = (w//2, h-10)
# Tolerance for color difference
loDiff = (30, 30, 30)
upDiff = (30, 30, 30)

cv2.floodFill(img.copy(), ff_mask, seed_pt, (255, 255, 255), loDiff, upDiff, cv2.FLOODFILL_FIXED_RANGE)

# ff_mask will have 1s where the floodfill filled
actual_mask = ff_mask[1:-1, 1:-1]

# Convert to 0/255
clean_mask = (actual_mask * 255).astype(np.uint8)

# Smooth edges
clean_mask = cv2.GaussianBlur(clean_mask, (7,7), 0)
_, clean_mask = cv2.threshold(clean_mask, 127, 255, cv2.THRESH_BINARY)

# Save the mask
out = np.zeros((h, w, 4), dtype=np.uint8)
out[:,:,3] = clean_mask
cv2.imwrite('assets/mask_collar.png', out)

print("Floodfill mask generated.")
