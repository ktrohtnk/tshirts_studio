import cv2
import numpy as np
import glob
import shutil

def extract_flat_mask(img_path, out_path):
    img = cv2.imread(img_path)
    if img is None:
        return
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    lower_black = np.array([0, 0, 0])
    upper_black = np.array([180, 255, 60])
    mask = cv2.inRange(hsv, lower_black, upper_black)
    
    # Use rembg as it's better for flat items! Wait, we have rembg!
    return

def extract_with_rembg(img_path, out_path):
    import rembg
    from PIL import Image
    import io
    
    with open(img_path, 'rb') as f:
        input_data = f.read()
    
    # Run rembg
    output_data = rembg.remove(input_data)
    img = Image.open(io.BytesIO(output_data))
    
    # Convert to OpenCV
    img_cv = np.array(img)
    # The alpha channel is our mask!
    if img_cv.shape[2] == 4:
        alpha = img_cv[:,:,3]
        # Smooth and threshold
        alpha = cv2.GaussianBlur(alpha, (15,15), 0)
        _, alpha = cv2.threshold(alpha, 127, 255, cv2.THRESH_BINARY)
        out = np.zeros_like(img_cv)
        out[:,:,3] = alpha
        cv2.imwrite(out_path, out)
        print(f"rembg created mask {out_path}")

def extract_model_mask(img_path, out_path):
    img = cv2.imread(img_path)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    lower_black = np.array([0, 0, 0])
    upper_black = np.array([180, 255, 60])
    mask = cv2.inRange(hsv, lower_black, upper_black)
    
    kernel = np.ones((5,5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        valid_contours = []
        for c in contours:
            x,y,w,h = cv2.boundingRect(c)
            if y > img.shape[0] * 0.15: # Skip top 15% (hair)
                valid_contours.append(c)
        if valid_contours:
            largest_contour = max(valid_contours, key=cv2.contourArea)
            clean_mask = np.zeros_like(mask)
            cv2.drawContours(clean_mask, [largest_contour], -1, 255, -1)
            clean_mask = cv2.GaussianBlur(clean_mask, (15,15), 0)
            _, clean_mask = cv2.threshold(clean_mask, 127, 255, cv2.THRESH_BINARY)
            
            out = np.zeros((img.shape[0], img.shape[1], 4), dtype=np.uint8)
            out[:,:,3] = clean_mask
            cv2.imwrite(out_path, out)
            print(f"Created model mask {out_path}")

import os
brain_dir = '/Users/fds_2023_1/.gemini/antigravity/brain/a9dcbb1c-9e36-4eb9-ab73-db2c5b8d2201/'

# Copy generated images to assets and make masks
fronts = glob.glob(brain_dir + 'front_black_*.png')
if fronts:
    shutil.copy(fronts[-1], 'assets/front_black.png')
    extract_with_rembg('assets/front_black.png', 'assets/mask_front_black.png')

backs = glob.glob(brain_dir + 'back_black_*.png')
if backs:
    shutil.copy(backs[-1], 'assets/back_black.png')
    extract_with_rembg('assets/back_black.png', 'assets/mask_back_black.png')

collars = glob.glob(brain_dir + 'outer_collar_black_*.png')
if collars:
    shutil.copy(collars[-1], 'assets/outer_collar_black.png')
    extract_with_rembg('assets/outer_collar_black.png', 'assets/mask_collar_black.png')

tags = glob.glob(brain_dir + 'inner_tag_black_*.png')
if tags:
    shutil.copy(tags[-1], 'assets/inner_tag_black.png')
    extract_with_rembg('assets/inner_tag_black.png', 'assets/mask_inner_black.png')

males = glob.glob(brain_dir + 'model_male_black_*.png')
if males:
    shutil.copy(males[-1], 'assets/model_male_black.png')
    extract_model_mask('assets/model_male_black.png', 'assets/mask_model_male_black.png')

females = glob.glob(brain_dir + 'model_female_black_*.png')
if females:
    shutil.copy(females[-1], 'assets/model_female_black.png')
    extract_model_mask('assets/model_female_black.png', 'assets/mask_model_female_black.png')
