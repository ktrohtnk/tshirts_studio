import cv2
import numpy as np

def make_black(img_path, mask_path, out_path):
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    mask_img = cv2.imread(mask_path, cv2.IMREAD_UNCHANGED)
    
    if img is None or mask_img is None:
        print(f"Skipping {img_path} (missing file)")
        return
        
    # Get alpha channel of mask
    if mask_img.shape[2] == 4:
        mask = mask_img[:,:,3]
    else:
        # If mask is grayscale
        mask = cv2.cvtColor(mask_img, cv2.COLOR_BGR2GRAY)
        
    # Normalize mask to 0-1
    mask_float = mask.astype(np.float32) / 255.0
    mask_3d = np.dstack([mask_float, mask_float, mask_float])
    
    # We will invert the RGB channels.
    bgr = img[:,:,:3].astype(np.float32)
    
    # Invert
    inverted = 255.0 - bgr
    
    # To make it look like a nice black (not 100% pitch black), maybe scale it slightly
    # inverted = inverted * 0.8 + 20
    
    # Blend with original using mask
    blended = bgr * (1 - mask_3d) + inverted * mask_3d
    
    # Put back into uint8
    out = np.clip(blended, 0, 255).astype(np.uint8)
    
    # Add alpha back if original had it
    if img.shape[2] == 4:
        out = np.dstack([out, img[:,:,3]])
        
    cv2.imwrite(out_path, out)
    print(f"Generated {out_path}")

make_black('assets/front.png', 'assets/mask_front.png', 'assets/front_black.png')
make_black('assets/back.png', 'assets/mask_back.png', 'assets/back_black.png')
make_black('assets/outer_collar.png', 'assets/mask_collar.png', 'assets/outer_collar_black.png')
make_black('assets/inner_tag.png', 'assets/mask_inner.png', 'assets/inner_tag_black.png')
make_black('assets/model_male.png', 'assets/mask_model_male.png', 'assets/model_male_black.png')
make_black('assets/model_female.png', 'assets/mask_model_female.png', 'assets/model_female_black.png')

