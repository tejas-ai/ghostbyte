from PIL import Image, ImageChops
import sys

def trim(im):
    bg = Image.new(im.mode, im.size, im.getpixel((0,0)))
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

def trim_image(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
        trimmed_img = trim(img)
        trimmed_img.save(output_path, "PNG")
        print(f"Trimmed image saved to {output_path}")
        print(f"Original size: {img.size}")
        print(f"New size: {trimmed_img.size}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python trim_image.py <input> <output>")
        sys.exit(1)
    trim_image(sys.argv[1], sys.argv[2])
