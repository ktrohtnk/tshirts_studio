import cv2
import numpy as np
import glob
import shutil
import rembg
from PIL import Image
import io

brain_dir = '/Users/fds_2023_1/.gemini/antigravity/brain/a9dcbb1c-9e36-4eb9-ab73-db2c5b8d2201/'

def extract_with_rembg(img_path, out_path):
    with open(img_path, 'rb') as f:
        input_data = f.read()
    output_data = rembg.remove(input_data)
    img = Image.open(io.BytesIO(output_data))
    img_cv = np.array(img)
    if img_cv.shape[2] == 4:
        alpha = img_cv[:,:,3]
        alpha = cv2.GaussianBlur(alpha, (15,15), 0)
        _, alpha = cv2.threshold(alpha, 127, 255, cv2.THRESH_BINARY)
        out = np.zeros_like(img_cv)
        out[:,:,3] = alpha
        cv2.imwrite(out_path, out)
        print(f"rembg created mask {out_path}")

males = glob.glob(brain_dir + 'model_male_black_regen_*.png')
if males:
    shutil.copy(males[-1], 'assets/model_male_black.png')
    extract_with_rembg('assets/model_male_black.png', 'assets/mask_model_male_black.png')

females = glob.glob(brain_dir + 'model_female_black_regen_*.png')
if females:
    shutil.copy(females[-1], 'assets/model_female_black.png')
    extract_with_rembg('assets/model_female_black.png', 'assets/mask_model_female_black.png')
