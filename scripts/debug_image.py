from PIL import Image
import os
import sys

def analyze_image(path):
    try:
        if not os.path.exists(path):
            print(f"File not found: {path}")
            return

        print(f"Analyzing: {path}")
        print(f"Size: {os.path.getsize(path)} bytes")
        
        img = Image.open(path)
        print(f"Format: {img.format}")
        print(f"Mode: {img.mode}")
        print(f"Dimensions: {img.size}")
        
        img = img.convert("RGBA")
        
        # Sample corners
        width, height = img.size
        corners = [
            (0, 0),
            (width-1, 0),
            (0, height-1),
            (width-1, height-1)
        ]
        
        print("\nCorner Pixels (R, G, B, A):")
        for x, y in corners:
            pixel = img.getpixel((x, y))
            print(f"({x}, {y}): {pixel}")
            
        # Sample center (just to see)
        center_pixel = img.getpixel((width//2, height//2))
        print(f"Center: {center_pixel}")
        
        # Check for unique colors count (approx)
        colors = img.getcolors(maxcolors=256)
        if colors:
            print(f"\nColor palette size: {len(colors)}")
        else:
            print("\nMore than 256 colors")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_image(sys.argv[1])
