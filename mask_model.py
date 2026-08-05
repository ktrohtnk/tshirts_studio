import cv2
import numpy as np
import sys
import glob

def create_shirt_mask(image_path, output_path):
    img = cv2.imread(image_path)
    if img is None:
        print(f"Failed to load {image_path}")
        return
    
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    lower_white = np.array([0, 0, 150])
    upper_white = np.array([180, 50, 255])
    
    mask = cv2.inRange(hsv, lower_white, upper_white)
    
    kernel = np.ones((5,5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        largest_contour = max(contours, key=cv2.contourArea)
        clean_mask = np.zeros_like(mask)
        cv2.drawContours(clean_mask, [largest_contour], -1, 255, -1)
        
        clean_mask = cv2.GaussianBlur(clean_mask, (15,15), 0)
        _, clean_mask = cv2.threshold(clean_mask, 127, 255, cv2.THRESH_BINARY)
        
        out = np.zeros((img.shape[0], img.shape[1], 4), dtype=np.uint8)
        out[:,:,3] = clean_mask
        cv2.imwrite(output_path, out)
        print(f"Saved {output_path}")
    else:
        print("No contours found")

male_images = glob.glob('/Users/fds_2023_1/.gemini/antigravity/brain/a9dcbb1c-9e36-4eb9-ab73-db2c5b8d2201/model_male_japanese_v3_*.png')
female_images = glob.glob('/Users/fds_2023_1/.gemini/antigravity/brain/a9dcbb1c-9e36-4eb9-ab73-db2c5b8d2201/model_female_untucked_*.png')

create_shirt_mask(male_images[-1], 'assets/mask_model_male.png')
create_shirt_mask(female_images[-1], 'assets/mask_model_female.png')
