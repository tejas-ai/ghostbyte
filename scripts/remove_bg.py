import sys
try:
    from PIL import Image
    import numpy as np
except ImportError:
    print("Pillow not installed")
    sys.exit(1)

def remove_black_bg(input_path, output_path, tolerance=30):
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        datas = img.getdata()

        new_data = []
        for item in datas:
            # Check for blackish pixels
            # item is (R, G, B, A)
            if item[0] < tolerance and item[1] < tolerance and item[2] < tolerance:
                new_data.append((255, 255, 255, 0)) # Transparent
            else:
                new_data.append(item)

        img.putdata(new_data)
        img.save(output_path, "PNG")
        print(f"Successfully processed {input_path}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python remove_bg.py <input> <output>")
        sys.exit(1)
    remove_black_bg(sys.argv[1], sys.argv[2])
