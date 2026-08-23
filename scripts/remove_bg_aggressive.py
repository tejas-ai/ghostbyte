from PIL import Image
import sys
import numpy as np

def remove_all_black(input_path, output_path, threshold=50):
    try:
        img = Image.open(input_path).convert("RGBA")
        data = np.array(img)
        
        # content is [R, G, B, A]
        red, green, blue, alpha = data.T
        
        # defined "black" as pixels where all RGB channels are below threshold
        black_areas = (red < threshold) & (green < threshold) & (blue < threshold)
        
        # Set alpha to 0 for those pixels
        data[..., 3][black_areas.T] = 0
        
        img = Image.fromarray(data)
        img.save(output_path, "PNG")
        print(f"Aggressively processed {input_path}")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    remove_all_black(sys.argv[1], sys.argv[2])
