import sys
try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Pillow not installed")
    sys.exit(1)

def remove_background_floodfill(input_path, output_path, tolerance=50):
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        
        # Get the color of the top-left pixel to use as the background reference
        bg_color = img.getpixel((0, 0))
        print(f"Detected background color at (0,0): {bg_color}")

        # Create a mask initialized to 0 (transparent)
        # We will flood fill this mask with 1 (opaque) where the object is
        # Actually, let's do it the other way: flood fill the BACKGROUND
        
        ImageDraw.floodfill(img, (0, 0), (0, 0, 0, 0), thresh=tolerance)
        ImageDraw.floodfill(img, (width-1, 0), (0, 0, 0, 0), thresh=tolerance)
        ImageDraw.floodfill(img, (0, height-1), (0, 0, 0, 0), thresh=tolerance)
        ImageDraw.floodfill(img, (width-1, height-1), (0, 0, 0, 0), thresh=tolerance)
        
        img.save(output_path, "PNG")
        print(f"Successfully processed {input_path} with floodfill")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python remove_bg_flood.py <input> <output>")
        sys.exit(1)
    remove_background_floodfill(sys.argv[1], sys.argv[2])
