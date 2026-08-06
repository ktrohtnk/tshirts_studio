import cv2
import numpy as np

def recolor_shirt(img_path, mask_path, out_path, tint_factor=0.15):
    img = cv2.imread(img_path)
    mask = cv2.imread(mask_path, cv2.IMREAD_UNCHANGED)
    
    if img is None or mask is None:
        print(f"Error loading {img_path} or {mask_path}")
        return
        
    # The mask might have an alpha channel or be a single channel grayscale
    if len(mask.shape) == 3 and mask.shape[2] == 4:
        mask_alpha = mask[:, :, 3] / 255.0
    elif len(mask.shape) == 3:
        mask_alpha = mask[:, :, 0] / 255.0
    else:
        mask_alpha = mask / 255.0
        
    # Create the dark version of the image
    # To keep shadows realistic, we multiply by the tint factor
    dark_img = img.astype(np.float32) * tint_factor
    
    # Blend using the mask
    mask_alpha_3d = np.stack([mask_alpha]*3, axis=2)
    
    result = img.astype(np.float32) * (1 - mask_alpha_3d) + dark_img * mask_alpha_3d
    
    cv2.imwrite(out_path, result.astype(np.uint8))
    print(f"Saved {out_path}")

recolor_shirt('assets/model_male.png', 'assets/mask_model_male.png', 'assets/model_male_black.png')
recolor_shirt('assets/model_female.png', 'assets/mask_model_female.png', 'assets/model_female_black.png')
