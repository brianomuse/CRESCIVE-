import zipfile
import os

def make_zip():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_public = os.path.join(base_dir, "public", "crescive-app.zip")
    output_root = os.path.join(base_dir, "crescive-app.zip")
    exclude_dirs = {"node_modules", "dist", "dev-dist", ".git", ".cache", "__pycache__"}
    exclude_files = {".dev.pid", ".dev.env.json", "crescive-app.zip"}

    os.makedirs(os.path.join(base_dir, "public"), exist_ok=True)

    with zipfile.ZipFile(output_public, "w", zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(base_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for f in files:
                if f in exclude_files or f.endswith(".zip"):
                    continue
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, base_dir)
                z.write(full_path, rel_path)

    # Also copy to root
    import shutil
    shutil.copyfile(output_public, output_root)
    dist_dir = os.path.join(base_dir, "dist")
    if os.path.exists(dist_dir):
        shutil.copyfile(output_public, os.path.join(dist_dir, "crescive-app.zip"))

    print(f"Created crescive-app.zip ({os.path.getsize(output_public)} bytes)")

if __name__ == "__main__":
    make_zip()
