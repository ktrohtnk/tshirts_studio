import cv2
import numpy as np
import glob

male_images = glob.glob('/Users/fds_2023_1/.gemini/antigravity/brain/a9dcbb1c-9e36-4eb9-ab73-db2c5b8d2201/model_male_black_*.png')
if not male_images:
    print("No images found")
    exit()
    
img_path = male_images[-1]
img = cv2.imread(img_path)

hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

# Threshold for black (low V)
lower_black = np.array([0, 0, 0])
upper_black = np.array([180, 255, 60])

mask = cv2.inRange(hsv, lower_black, upper_black)

kernel = np.ones((5,5), np.uint8)
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
if contours:
    # Filter out contours that are too small or likely to be hair (too high up)
    valid_contours = []
    for c in contours:
        x,y,w,h = cv2.boundingRect(c)
        if y > img.shape[0] * 0.2: # Skip things in the top 20% (hair)
            valid_contours.append(c)
            
    if valid_contours:
        largest_contour = max(valid_contours, key=cv2.contourArea)
        clean_mask = np.zeros_like(mask)
        cv2.drawContours(clean_mask, [largest_contour], -1, 255, -1)
        
        clean_mask = cv2.GaussianBlur(clean_mask, (15,15), 0)
        _, clean_mask = cv2.threshold(clean_mask, 127, 255, cv2.THRESH_BINARY)
        
        out = np.zeros((img.shape[0], img.shape[1], 4), dtype=np.uint8)
        out[:,:,3] = clean_mask
        cv2.imwrite('assets/test_mask_male_black.png', out)
        print("Saved assets/test_mask_male_black.png")
    else:
        print("No valid contours")
else:
    print("No contours found")
