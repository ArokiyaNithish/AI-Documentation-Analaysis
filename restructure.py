import os
import shutil

src_dir = r"c:\Users\Arokiya Nithish\OneDrive\Videos\doc ai\backend"
dest_dir = r"c:\Users\Arokiya Nithish\OneDrive\Videos\doc ai\src_new"

# Ignore these hefty/locked/unnecessary directories
ignore_patterns = shutil.ignore_patterns("venv", "__pycache__", "vector_store\\storage")

if os.path.exists(dest_dir):
    shutil.rmtree(dest_dir)

print(f"Copying {src_dir} to {dest_dir} (bypassing venv)...")
shutil.copytree(src_dir, dest_dir, ignore=ignore_patterns)
print("Done! Core files replicated.")
